export type Locale = 'zh-TW' | 'en'

export interface TranslationKeys {
  common: {
    confirm: string
    cancel: string
    copy: string
    copySuccess: string
    copyFailed: string
    download: string
    downloading: string
    share: string
    close: string
    link: string
    extractCode: string
    verifyTool: string
  }
  home: {
    shareCode: string
    textShare: string
    fileShare: string
    selectFile: string
    burnAfterRead: string
    history: string
    fileTooLarge: string
    shared: string
    received: string
    noHistory: string
  }
  duration: {
    default: string
    minute: string
    hour: string
    day: string
    week: string
    month: string
    year: string
    permanent: string
    expiryConfig: string
    expiresIn: string
    expiresAt: string
    permanentValidity: string
  }
  password: {
    sharePassword: string
    enterPassword: string
    clearPassword: string
    encryptedNotice: string
    decryptFailed: string
  }
  history: {
    noRecords: string
    deleteConfirm: string
    shareCodeClick: string
  }
  shareDialog: {
    title: string
    hashLabel: string
  }
  fileDialog: {
    title: string
    textTitle: string
    fileTitle: string
    encryptedHint: string
    burnAfterReadWarning: string
    burnAfterReadTitle: string
    hashLabel: string
  }
  admin: {
    shareList: string
    text: string
    permanent: string
    filename: string
    shareCode: string
    size: string
    sizeTooltip: string
    expiryDate: string
    isEncrypted: string
    createdAt: string
    actions: string
    deleteSelected: string
    selected: string
    delete: string
    sortedAscending: string
    sortedDescending: string
  }
  errors: {
    versionMismatch: string
    integrityCheckFailed: string
    chunkInfoFailed: string
    suggestR2: string
    invalidCode: string
    shareExpired: string
    emptyContent: string
    fileTooLarge: string
    chunkNotFound: string
    codeGenerationFailed: string
    invalidToken: string
    invalidObjectId: string
    adminDisabled: string
    chunkUploadFailed: string
    chunkIncomplete: string
    unknownError: string
  }
}
