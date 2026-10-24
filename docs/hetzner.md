# PARON στον Hetzner VPS

Κάθε Merge στο `main` ανεβάζει μόνο του τη νέα έκδοση: πρώτα τρέχει το CI και, αν πρασινίσει,
το `.github/workflows/deploy.yml` στέλνει τον κώδικα στον VPS και τρέχει το `deploy/install.sh`.
Την πρώτη φορά στήνει όλο τον server (Node, https με Caddy, υπηρεσία, τείχος, νυχτερινά αντίγραφα).
Τα δεδομένα μένουν στο `/var/lib/ergodo` και δεν πειράζονται από τις νέες εκδόσεις.
Αν μια νέα έκδοση δεν ξεκινήσει, γυρνά μόνη της στην προηγούμενη.

## Στήσιμο μία φορά (περίπου 10 λεπτά)

1. **Κλειδί για το deploy**, στο Terminal του Mac:

   ```
   ssh-keygen -t ed25519 -f ~/.ssh/paron_deploy -N "" -C paron-deploy
   pbcopy < ~/.ssh/paron_deploy.pub
   ```

2. **Server στο Hetzner**: console.hetzner.com → νέο project «PARON» → *Add Server*:
   - *Location*: Nuremberg ή Falkenstein (Γερμανία)
   - *Image*: **Ubuntu 24.04**
   - *Type*: Shared vCPU, ο φθηνότερος x86 (CX23 ή αντίστοιχος, 2 vCPU / 4 GB)
   - *SSH keys*: *Add SSH key* → επικόλληση (είναι ήδη στο πρόχειρο από το βήμα 1)
   - *Backups*: προαιρετικά ναι (+20% στην τιμή, αντίγραφο όλου του server κάθε μέρα)
   - *Name*: `paron` → *Create & Buy now*. Κράτα τη διεύθυνση **IPv4**.

3. **Secrets στο GitHub**: repo → *Settings* → *Secrets and variables* → *Actions* →
   *New repository secret*, ένα-ένα:

   | Όνομα | Τιμή |
   |---|---|
   | `VPS_HOST` | η IPv4 του server |
   | `VPS_SSH_KEY` | το ιδιωτικό κλειδί: `pbcopy < ~/.ssh/paron_deploy` και επικόλληση |
   | `ERGO_ADMIN_PASSWORD` | κωδικός του πρώτου διαχειριστή (`ergolavos`), μόνο γράμματα και αριθμοί, 12+ |

   Οι κωδικοί μένουν μόνο εκεί, ποτέ στον κώδικα ή σε μήνυμα.

4. **Πρώτο deploy**: repo → *Actions* → *Deploy* → *Run workflow*. Σε 3-5 λεπτά η εφαρμογή
   ανοίγει στο `https://<ip-με-παύλες>.sslip.io` (π.χ. `https://5-75-1-2.sslip.io`)
   με κανονικό https, χωρίς να έχουμε αγοράσει domain ακόμα. Η διεύθυνση γράφεται και στο log του deploy.

## Δικό μας domain (όταν αγοραστεί το paron.gr)

1. Στο papaki.gr: εγγραφή **A** για το `app` → η IPv4 του server.
2. Στο GitHub: secret `VPS_DOMAIN` = `app.paron.gr`.
3. *Actions* → *Deploy* → *Run workflow*. Το https ενεργοποιείται μόνο του.

## Κάθε μέρα

- Αλλαγές: PR ανά θέμα → CI πράσινο → **Merge** → νέα έκδοση σε 2-3 λεπτά.
- Κατά την αλλαγή έκδοσης η εφαρμογή λείπει για 2-3 δευτερόλεπτα.
- Επαναφορά παλιάς έκδοσης: *Actions* → παλιό επιτυχημένο *Deploy* → *Re-run all jobs*.
- Αντίγραφα: τα δεδομένα κάθε βράδυ στο `/var/backups/ergodo` (30 μέρες), συν ημερήσιο
  αντίγραφο μέσα στην εφαρμογή (60 μέρες), συν τα Backups του Hetzner αν τα άναψες.

## Πολλές εταιρείες στο ίδιο app

Η υπηρεσία `ergodo` τρέχει το `server/gateway.js`. Αυτό ξεκινά ένα `server.js` για κάθε εταιρεία, με δικό της φάκελο δεδομένων, χρήστες και θύρα, και στέλνει κάθε αίτημα στη σωστή εταιρεία (cookie `paron_co`).

- **Αρχική εταιρεία:** τα δεδομένα μένουν στο `/var/lib/ergodo`, όπως πριν. Όποιος μπαίνει χωρίς επιλεγμένη εταιρεία πηγαίνει εκεί.
- **Νέα εταιρεία:** από το `https://app.theparon.gr/co` (ή «Άλλη εταιρεία ή νέα εταιρεία» στη σύνδεση). Δίνεις όνομα και κωδικό. Μετά, από τον ίδιο browser, φτιάχνεις τον διαχειριστή και διαλέγεις κλάδο. Τα δεδομένα της είναι στο `/var/lib/ergodo/companies/<κωδικός>`, και ο κατάλογος των εταιρειών στο `/var/lib/ergodo/companies.json`. Μπαίνουν και αυτά στο νυχτερινό αντίγραφο.
- **Σύνδεσμος για τους ανθρώπους μιας εταιρείας:** `https://app.theparon.gr/co/<κωδικός>`.
- **Ρυθμίσεις** (στο `/etc/ergodo/ergodo.env`, μετά `systemctl restart ergodo`): `PARON_SIGNUP=0` κλείνει τις νέες εγγραφές, `PARON_MAX_COMPANIES` (προεπιλογή 30), `PARON_MAIN_CODE` και `PARON_MAIN_NAME` για τον κωδικό και το όνομα της αρχικής εταιρείας.
