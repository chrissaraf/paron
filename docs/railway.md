# PARON στο Railway

Κάθε Merge στο `main` ανεβάζει μόνο του τη νέα έκδοση, αφού περάσει το CI (GitHub Actions).
Οι ρυθμίσεις build/εκκίνησης είναι στο `railway.json`. Τα δεδομένα (χρήστες, πρόγραμμα,
φωτογραφίες, ημερήσια αντίγραφα) μένουν σε μόνιμο δίσκο (Volume) στο `/data` και δεν
χάνονται σε νέα έκδοση.

## Στήσιμο μία φορά (περίπου 5 λεπτά)

1. **railway.com** → *Login with GitHub* → πλάνο **Hobby** (5 $/μήνα, περιλαμβάνει 5 $ χρήση).
2. *New Project* → *Deploy from GitHub repo* → `chrissaraf/paron`.
   Αν δεν φαίνεται, *Configure GitHub App* και δώσε πρόσβαση στο repo.
3. Στο service που φτιάχτηκε → **Settings**:
   - *Region*: **EU West (Amsterdam)**.
   - *Source* → *Branch*: `main`, και άναψε το **Wait for CI**
     (ανεβαίνει μόνο αν πρασινίσει το CI).
4. **Volume**: δεξί κλικ στο κενό του project → *Add Volume* → σύνδεση στο service →
   *Mount path*: `/data`.
5. **Variables** (στο service → *Variables* → *Raw Editor*):

   ```
   DATA_DIR=/data
   TRUST_PROXY=1
   TZ=Europe/Athens
   ERGO_USER=ergolavos
   ERGO_PASSWORD=<δικός σου δυνατός κωδικός>
   ```

   Ο κωδικός μπαίνει μόνο εδώ, ποτέ στο GitHub ή σε μήνυμα. Χρησιμοποιείται μόνο για τον
   πρώτο διαχειριστή· μετά τον αλλάζεις από «Ο λογαριασμός μου».
6. **Settings → Networking → Generate Domain**. Βγαίνει διεύθυνση `….up.railway.app`
   με https. Άνοιξέ την και συνδέσου με `ergolavos`.

## Δικό μας domain (όταν αγοραστεί το paron.gr)

*Settings → Networking → Custom Domain* → `app.paron.gr`. Το Railway δείχνει μια εγγραφή
**CNAME** που μπαίνει στο papaki.gr. Το https ενεργοποιείται μόνο του.

## Κάθε μέρα

- Αλλαγές: PR ανά θέμα → CI πράσινο → **Merge** → νέα έκδοση σε 1-2 λεπτά.
- Κατά την αλλαγή έκδοσης η εφαρμογή λείπει για λίγα δευτερόλεπτα (ο δίσκος συνδέεται σε
  έναν server κάθε φορά).
- Αν κάτι πάει στραβά: *Deployments* → προηγούμενη έκδοση → **Redeploy**.
- Ιστορικό/σφάλματα: *Deployments* → *View logs*.

## Αντίγραφα

Ο server κρατά ημερήσιο αντίγραφο των δεδομένων στο `/data` (60 μέρες). Για αντίγραφο έξω
από τον ίδιο δίσκο: *Volume* → *Backups* → ημερήσιο πρόγραμμα, αν το δίνει το πλάνο.
