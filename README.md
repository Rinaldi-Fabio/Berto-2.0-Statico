# Berto 2.0 Statico

Anteprima statica del sito WordPress **Pizzeria Da Berto 2.0** (Gradara), pubblicata con GitHub Pages:
https://rinaldi-fabio.github.io/Berto-2.0-Statico/

Copia di sola lettura per far vedere il sito al cliente: niente pannello WordPress, pagine con `noindex`
(Google non le indicizza). Il progetto vero (tema, strumenti) sta nella repo privata `Da-Berto-2.0`.

## Aggiornare l'anteprima
Con il sito `da-berto-20.local` avviato in Local:

```bash
node esporta.mjs
git add -A && git commit -m "Aggiorna anteprima" && git push
```

`esporta.mjs` legge le pagine via HTTP (WordPress non viene modificato), rende relativi gli indirizzi e
ricrea tutto da zero. GitHub Pages pubblica in 1–2 minuti.
