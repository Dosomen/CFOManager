export const de = {
  appName: 'CFOManager',
  common: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Anlegen',
    confirm: 'Bestätigen',
    loading: 'Wird geladen…',
    requiredField: 'Pflichtfeld',
  },
  nav: {
    dashboard: 'Dashboard',
    mandanten: 'Mandanten',
    einstellungen: 'Einstellungen',
  },
  auth: {
    login: {
      title: 'Anmelden',
      emailLabel: 'E-Mail',
      passwordLabel: 'Passwort',
      submit: 'Anmelden',
      forgotPassword: 'Passwort vergessen?',
      invalidCredentials: 'E-Mail oder Passwort falsch',
      rateLimited:
        'Zu viele fehlgeschlagene Versuche. Bitte warte einige Minuten und versuche es erneut.',
      unexpectedError: 'Anmeldung fehlgeschlagen. Bitte versuche es später erneut.',
    },
    mfa: {
      title: 'Zwei-Faktor-Authentifizierung',
      promptCode: 'Bitte gib den 6-stelligen Code aus deiner Authenticator-App ein.',
      submit: 'Bestätigen',
      invalidCode: 'Der Code ist ungültig oder abgelaufen.',
    },
    passwordReset: {
      requestTitle: 'Passwort zurücksetzen',
      requestSubmit: 'Reset-Link senden',
      requestSuccess:
        'Wenn die Adresse existiert, haben wir dir einen Link gesendet.',
      confirmTitle: 'Neues Passwort setzen',
      newPasswordLabel: 'Neues Passwort',
      confirmSubmit: 'Passwort speichern',
      invalidToken:
        'Der Reset-Link ist abgelaufen oder ungültig. Bitte fordere einen neuen an.',
    },
    changePassword: {
      title: 'Passwort ändern',
      currentLabel: 'Aktuelles Passwort',
      newLabel: 'Neues Passwort',
      confirmLabel: 'Neues Passwort wiederholen',
      submit: 'Passwort ändern',
      mismatch: 'Die neuen Passwörter stimmen nicht überein.',
      success: 'Passwort erfolgreich geändert.',
    },
    twoFactor: {
      title: 'Zwei-Faktor-Authentifizierung',
      description:
        'Schütze deinen Account zusätzlich mit einer Authenticator-App (z.B. 1Password, Authy, Google Authenticator).',
      enable: 'Aktivieren',
      disable: 'Deaktivieren',
      scanQrCode: 'Scanne den QR-Code mit deiner Authenticator-App.',
      enterCode: 'Gib den 6-stelligen Code aus der App ein.',
      verify: 'Bestätigen',
      enabled: 'Aktiv',
      disabled: 'Inaktiv',
    },
    logout: 'Abmelden',
  },
  mandant: {
    wizard: {
      title: 'Ersten Mandanten anlegen',
      subtitle: 'Lege deine erste Gesellschaft an, um loszulegen.',
      submit: 'Mandant anlegen',
    },
    fields: {
      name: 'Name der Gesellschaft',
      namePlaceholder: 'z.B. Musterfirma GmbH',
      rechtsform: 'Rechtsform',
      basiswaehrung: 'Basiswährung',
      geschaeftsjahrStart: 'Geschäftsjahr-Start (MM-TT)',
      ustIdnr: 'USt-IdNr (optional)',
      ustIdnrPlaceholder: 'z.B. DE123456789',
      diamantMandantennummer: 'Diamant-Mandantennummer (optional)',
    },
    rechtsformLabel: {
      GmbH: 'GmbH',
      AG: 'AG',
      UG: 'UG (haftungsbeschränkt)',
      GmbH_und_Co_KG: 'GmbH & Co. KG',
      Einzelunternehmen: 'Einzelunternehmen',
      Sonstiges: 'Sonstiges',
    },
    list: {
      title: 'Mandanten',
      empty: 'Du hast noch keine Mandanten.',
      createNew: 'Neuen Mandant anlegen',
      columnName: 'Name',
      columnRechtsform: 'Rechtsform',
      columnBasiswaehrung: 'Währung',
      columnGeschaeftsjahr: 'Geschäftsjahr',
      columnActions: 'Aktionen',
    },
    edit: {
      title: 'Mandant bearbeiten',
    },
    delete: {
      title: 'Mandant löschen',
      warning:
        'Alle Daten dieses Mandanten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.',
      confirmInstruction: 'Gib zur Bestätigung den Mandantennamen ein:',
      mismatch: 'Der eingegebene Name stimmt nicht überein.',
      lastMandant: 'Letzter Mandant kann nicht gelöscht werden.',
    },
    switcher: {
      addNew: 'Neuen Mandant anlegen…',
      noActive: 'Kein Mandant ausgewählt',
    },
    errors: {
      notFound: 'Mandant nicht gefunden.',
      noAccess: 'Du hast keinen Zugriff auf diesen Mandanten.',
      unexpectedError: 'Es ist ein unerwarteter Fehler aufgetreten.',
    },
  },
  errors: {
    unauthorized: 'Bitte melde dich an, um fortzufahren.',
    server: 'Serverfehler. Bitte versuche es später erneut.',
    invalidInput: 'Bitte überprüfe deine Eingaben.',
  },
} as const

export type Messages = typeof de
