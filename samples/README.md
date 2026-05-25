# Sample Files

Sample export files from Diamant Software and other source systems.

**These files are gitignored** (see `.gitignore`) so real customer data
never lands in version control. Drop your sample files here for use
during development and architecture work.

## Expected files for PROJ-2 (Diamant Excel Import)

- `diamant-summenliste-YYYY-MM.xlsx` — A Summen-/Saldenliste exported
  from Diamant (one file per month). Used to lock down the expected
  column structure during `/architecture PROJ-2` and as test fixtures.

If you want to share an anonymized fixture in version control later,
place it under `tests/fixtures/` instead and adjust the gitignore.

## Demo data generator

`generate-demo-data.py` produces three synthetic but balanced sample
files for Q1 2026 (Herschel GmbH, SKR03):

```bash
python3 samples/generate-demo-data.py
```

Output: `diamant-summenliste-2026-01.xlsx`, `…-02.xlsx`, `…-03.xlsx`.

The values are made up but accounting-correct (EB Soll = EB Haben,
VK Soll = VK Haben, Saldo Soll = Saldo Haben). Used until real
Diamant exports become available.
