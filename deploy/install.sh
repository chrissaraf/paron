#!/usr/bin/env bash
# PARON: εγκατάσταση ή ενημέρωση σε VPS με Ubuntu 22.04 / 24.04 (ή Debian 12).
#
#   sudo bash deploy/install.sh app.paron.gr [email-για-ειδοποιήσεις-https]
#
# Τι κάνει: Node.js, Caddy (https αυτόματα με Let's Encrypt), χρήστη συστήματος ergodo,
# υπηρεσία που ξεκινά μόνη της, τείχος προστασίας (μόνο 22, 80, 443), αυτόματες ενημερώσεις
# ασφαλείας και νυχτερινό αντίγραφο των δεδομένων. Αν ξανατρέξει, ενημερώνει την εφαρμογή
# και κρατά δεδομένα, χρήστες και ρυθμίσεις.
#
# Από το GitHub Actions (deploy.yml): PARON_QUICK=1 παραλείπει τα πακέτα συστήματος όταν υπάρχουν ήδη,
# και ο κωδικός του πρώτου διαχειριστή έρχεται από το PARON_ADMIN_PASSWORD αντί να φτιαχτεί τυχαίος.
# PARON_EXTRA_DOMAINS: επιπλέον διευθύνσεις για την ίδια εφαρμογή (π.χ. η <ip>.sslip.io ως εφεδρική).
set -euo pipefail

DOMAIN="${1:-}"; EMAIL="${2:-}"
R="${ERGODO_ROOT:-}"   # μόνο για δοκιμή σε άλλον φάκελο· κανονικά κενό
APP=$R/opt/ergodo; DATA=$R/var/lib/ergodo; CONF=$R/etc/ergodo; ENVF=$CONF/ergodo.env; BK=$R/var/backups/ergodo
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

say() { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mΣφάλμα: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "τρέξε το με sudo."
[[ "$DOMAIN" =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || die "δώσε τη διεύθυνση, π.χ.: sudo bash deploy/install.sh app.paron.gr"
[ -f "$SRC/server/server.js" ] && [ -f "$SRC/src/core.js" ] || die "τρέξε το μέσα από τον φάκελο ergodo που αποσυμπίεσες."
command -v apt-get >/dev/null || die "χρειάζεται Ubuntu ή Debian."
export DEBIAN_FRONTEND=noninteractive

QUICK=0; [ -n "${PARON_QUICK:-}" ] && command -v node >/dev/null && command -v caddy >/dev/null && QUICK=1
if [ "$QUICK" = 0 ]; then
say "Πακέτα συστήματος"
apt-get update -q
apt-get install -y -q curl ca-certificates gnupg ufw unattended-upgrades rsync debian-keyring debian-archive-keyring apt-transport-https
timedatectl set-timezone Europe/Athens 2>/dev/null || true
fi

say "Node.js"
NODE_MAJOR=0; command -v node >/dev/null && NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -q nodejs
fi
NODE_BIN="$(command -v node)"; echo "Node $("$NODE_BIN" -v)"

say "Caddy (https)"
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -y -q caddy
fi

say "Αρχεία εφαρμογής"
id ergodo >/dev/null 2>&1 || useradd --system --home "$DATA" --shell /usr/sbin/nologin ergodo
install -d -m 755 "$(dirname "$APP")"
install -d -m 700 -o ergodo -g ergodo "$DATA" "$BK"
install -d -m 750 "$CONF"
rm -rf "$APP.new" && mkdir -p "$APP.new"
cp -r "$SRC"/{server,src,public,build.js,package.json,index.html} "$APP.new"/
[ -f "$SRC/README.md" ] && cp "$SRC/README.md" "$APP.new"/
[ -d "$SRC/estiasi" ] && cp -r "$SRC/estiasi" "$APP.new"/   # σελίδα εστίασης, όταν ο κλάδος είναι εστίαση
rm -rf "$APP.old"; if [ -d "$APP" ]; then mv "$APP" "$APP.old"; fi
mv "$APP.new" "$APP"; chown -R root:root "$APP"; chmod -R a+rX "$APP"

FIRST=0
if [ ! -f "$ENVF" ]; then
  FIRST=1
  PASS="${PARON_ADMIN_PASSWORD:-$(tr -dc 'a-km-np-zA-HJ-NP-Z2-9' </dev/urandom | head -c 14 || true)}"
  cat > "$ENVF" <<ENV
# Ρυθμίσεις PARON. Μετά από αλλαγή: systemctl restart ergodo
PORT=8080
HOST=127.0.0.1
TRUST_PROXY=1
DATA_DIR=$DATA
TZ=Europe/Athens
# Πρώτος διαχειριστής (χρησιμοποιείται μόνο όταν δεν υπάρχει κανένας χρήστης)
ERGO_USER=ergolavos
ERGO_PASSWORD=$PASS
# Viber: dryrun = δοκιμαστικά, http = πραγματική αποστολή (βλ. README)
VIBER_PROVIDER=dryrun
VIBER_URL=
VIBER_HEADERS={}
VIBER_BODY=
VIBER_SENDER=
ENV
fi
chmod 640 "$ENVF"; chown root:ergodo "$ENVF"

say "Υπηρεσία ergodo"
install -d "$R/etc/systemd/system" "$R/etc/caddy" "$R/etc/cron.d" "$R/etc/apt/apt.conf.d"
cat > "$R/etc/systemd/system/ergodo.service" <<UNIT
[Unit]
Description=PARON
After=network-online.target
Wants=network-online.target

[Service]
User=ergodo
Group=ergodo
WorkingDirectory=$APP
EnvironmentFile=$ENVF
ExecStart=$NODE_BIN server/gateway.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=$DATA

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now ergodo >/dev/null
systemctl restart ergodo

say "Caddy για $DOMAIN"
{
  [ -n "$EMAIL" ] && printf '{\n\temail %s\n}\n\n' "$EMAIL"
  cat <<CADDY
$DOMAIN${PARON_EXTRA_DOMAINS:+, $PARON_EXTRA_DOMAINS} {
	encode gzip
	header Strict-Transport-Security "max-age=31536000"
	reverse_proxy 127.0.0.1:8080
}
CADDY
} > "$R/etc/caddy/Caddyfile"
caddy validate --config "$R/etc/caddy/Caddyfile" --adapter caddyfile >/dev/null
systemctl enable caddy >/dev/null; systemctl reload caddy 2>/dev/null || systemctl restart caddy

say "Τείχος προστασίας και ενημερώσεις ασφαλείας"
SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port /{print $2; exit}' || true)"   # να μην κλειδωθεί η σύνδεση SSH
ufw allow "${SSH_PORT:-22}/tcp" >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' > "$R/etc/apt/apt.conf.d/20auto-upgrades"

say "Νυχτερινό αντίγραφο δεδομένων (κρατά 30 μέρες)"
install -d "$R/usr/local/sbin"
cat > "$R/usr/local/sbin/ergodo-backup" <<BACKUP
#!/bin/sh
# PARON: νυχτερινό αντίγραφο. Τα δεδομένα σε ένα αρχείο ανά μέρα (κρατιούνται 30 μέρες).
# Οι φωτογραφίες του ημερολογίου δεν αλλάζουν ποτέ, οπότε μπαίνουν μία φορά σε κοινό φάκελο
# και όχι σε κάθε νυχτερινό αρχείο, για να μη γεμίζει ο δίσκος. Όσες σβήσει η εφαρμογή
# μεταφέρονται στο photos-deleted και φεύγουν από εκεί μετά από 30 μέρες.
set -eu
DATA="$DATA"; BK="$BK"
tar -czf "\$BK/ergodo-\$(date +%F).tar.gz" --exclude=./photos -C "\$DATA" .
find "\$BK" -maxdepth 1 -name 'ergodo-*.tar.gz' -mtime +30 -delete
if [ -d "\$DATA/photos" ]; then
  mkdir -p "\$BK/photos" "\$BK/photos-deleted"
  if command -v rsync >/dev/null; then rsync -a "\$DATA/photos/" "\$BK/photos/"
  else cp -a --update=none "\$DATA/photos/." "\$BK/photos/" 2>/dev/null || cp -an "\$DATA/photos/." "\$BK/photos/"; fi
  for f in "\$BK/photos/"*.jpg; do
    [ -e "\$f" ] || continue; n="\${f##*/}"
    [ -e "\$DATA/photos/\$n" ] || { mv "\$f" "\$BK/photos-deleted/\$n" && touch "\$BK/photos-deleted/\$n"; }
  done
  find "\$BK/photos-deleted" -type f -mtime +30 -delete
fi
BACKUP
chmod 755 "$R/usr/local/sbin/ergodo-backup"
cat > "$R/etc/cron.d/ergodo-backup" <<CRON
# PARON: αντίγραφο των δεδομένων κάθε βράδυ στις 02:30, κρατά 30 μέρες
30 2 * * * root $R/usr/local/sbin/ergodo-backup
CRON
chmod 644 "$R/etc/cron.d/ergodo-backup"

say "Έλεγχος"
ok=0; for i in $(seq 1 20); do curl -fs http://127.0.0.1:8080/api/health >/dev/null && { ok=1; break; }; sleep 1; done
if [ "$ok" != 1 ]; then
  journalctl -u ergodo -n 30 --no-pager || true
  if [ -d "$APP.old" ]; then   # γυρνά στην προηγούμενη έκδοση για να μη μείνει η εφαρμογή κάτω
    rm -rf "$APP.bad"; mv "$APP" "$APP.bad"; mv "$APP.old" "$APP"; systemctl restart ergodo
    die "η νέα έκδοση δεν ξεκίνησε· τρέχει ξανά η προηγούμενη (η νέα είναι στο $APP.bad)."
  fi
  die "η εφαρμογή δεν ξεκίνησε."
fi
rm -rf "$APP.old"
IP="$(curl -fs4 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}' || true)"
DNS="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR==1{print $1}' || true)"

printf '\n\033[1;32mΤο PARON τρέχει.\033[0m\n'
echo "  Διεύθυνση: https://$DOMAIN"
if [ "$DNS" != "$IP" ]; then
  echo "  ΠΡΟΣΟΧΗ: το $DOMAIN δείχνει σε '${DNS:-πουθενά}'. Βάλε εγγραφή A προς $IP στον πάροχο του domain."
  echo "  Το https ενεργοποιείται μόνο του λίγα λεπτά αφού γίνει αυτό."
fi
if [ "$FIRST" = 1 ] && [ -n "${PARON_ADMIN_PASSWORD:-}" ]; then
  echo "  Πρώτη σύνδεση:  όνομα χρήστη ergolavos   κωδικός: αυτός που έβαλες στο GitHub (ERGO_ADMIN_PASSWORD)"
  echo "  Άλλαξέ τον από «Ο λογαριασμός μου» και φτιάξε τους χρήστες από Ρυθμίσεις → Χρήστες."
elif [ "$FIRST" = 1 ]; then
  echo "  Πρώτη σύνδεση:  όνομα χρήστη ergolavos   κωδικός $PASS"
  echo "  Άλλαξέ τον αμέσως από «Ο λογαριασμός μου» και φτιάξε τους χρήστες από Ρυθμίσεις → Χρήστες."
fi
echo "  Ρυθμίσεις: $ENVF   Δεδομένα: $DATA   Αντίγραφα: $BK"
echo "  Κατάσταση: systemctl status ergodo   Ιστορικό: journalctl -u ergodo -f"
