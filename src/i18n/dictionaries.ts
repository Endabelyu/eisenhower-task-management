export type Language = 'id' | 'en';

export const dictionaries = {
  id: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.tasks': 'Semua Tugas',
    'nav.focus': 'Fokus Harian',
    'nav.stats': 'Statistik',
    'nav.settings': 'Pengaturan',

    // Dashboard
    'dashboard.welcome': 'Selamat datang kembali',
    'dashboard.overview': 'Ringkasan Tugas Anda',
    'dashboard.stats.completion': 'Tingkat Penyelesaian',
    'dashboard.stats.active': 'Tugas Aktif',
    'dashboard.stats.overdue': 'Terlambat',
    'dashboard.quadrants': 'Kuadran Prioritas',
    'dashboard.q1': 'Q1: Mendesak & Penting',
    'dashboard.q2': 'Q2: Tidak Mendesak tapi Penting',
    'dashboard.q3': 'Q3: Mendesak tapi Tidak Penting',
    'dashboard.q4': 'Q4: Tidak Mendesak & Tidak Penting',

    // Tasks Page
    'tasks.title': 'Tugas Anda',
    'tasks.add': 'Tambah Tugas',
    'tasks.search': 'Cari tugas...',
    'tasks.filter.all': 'Semua',
    'tasks.filter.active': 'Aktif',
    'tasks.filter.completed': 'Selesai',
    'tasks.empty': 'Belum ada tugas. Tambahkan tugas untuk memulai!',

    // Task Card
    'task.edit': 'Edit Tugas',
    'task.delete': 'Hapus',
    'task.done': 'Selesai',
    'task.undo': 'Batal Selesai',
    'task.save': 'Simpan',
    'task.cancel': 'Batal',
    'task.due.today': 'Batas hari ini',
    'task.due.overdue': 'Terlambat',

    // Task Form
    'form.title.new': 'Tugas Baru',
    'form.title.label': 'Judul',
    'form.description.label': 'Deskripsi',
    'form.dueDate.label': 'Batas Waktu',
    'form.priority.label': 'Tingkat Prioritas (1-10)',
    'form.impact.label': 'Tingkat Dampak (1-10)',
    'form.quadrant.label': 'Kuadran Eisenhower',
    'form.quadrant.auto': 'Auto-hitung berdasarkan Urgensi & Dampak',

    // Focus Page
    'focus.title': 'Fokus Harian',
    'focus.subtitle': 'Tugas prioritas utama di semua kuadran, diurutkan berdasarkan skor urgensi',
    'focus.budget.title': 'ANGGARAN WAKTU',
    'focus.budget.subtitle': 'Perkiraan waktu untuk set fokus saat ini',
    'focus.count.title': 'JUMLAH TUGAS FOKUS',
    'focus.count.subtitle': 'Saat ini menampilkan {count} tugas',
    'focus.empty': 'Tidak ada tugas aktif saat ini. Tambahkan atau buka kembali tugas untuk membangun sesi fokus Anda berikutnya.',

    // Pomodoro
    'pomodoro.title': 'Waktu Pomodoro',
    'pomodoro.focus': 'Sesi Fokus',
    'pomodoro.break': 'Istirahat',
    'pomodoro.start': 'Mulai',
    'pomodoro.pause': 'Jeda',
    'pomodoro.reset': 'Ulangi',
    'pomodoro.sound.label': 'Suara Latar',
    'pomodoro.sound.none': 'Tidak Ada',

    // Settings
    'settings.title': 'Pengaturan',
    'settings.appearance': 'Penampilan',
    'settings.theme': 'Tema',
    'settings.theme.light': 'Terang',
    'settings.theme.dark': 'Gelap',
    'settings.theme.system': 'Sistem',
    'settings.language': 'Bahasa',
    'settings.language.id': 'Bahasa Indonesia',
    'settings.language.en': 'English',
    'settings.pomodoro': 'Pengaturan Pomodoro',
    'settings.pomodoro.focus': 'Durasi Fokus (menit)',
    'settings.pomodoro.break': 'Durasi Istirahat (menit)',
    'settings.account': 'Akun',
    'settings.account.logout': 'Keluar',

    // Context Menu
    'auth.login': 'Masuk ke Kuadran',
    'auth.signup': 'Buat akun',
    'auth.email': 'Email',
    'auth.password': 'Kata Sandi',
    'auth.submit.login': 'Masuk',
    'auth.submit.signup': 'Daftar',
    'auth.toggle.login': 'Sudah punya akun? Masuk',
    'auth.toggle.signup': 'Belum punya akun? Daftar'
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.tasks': 'All Tasks',
    'nav.focus': 'Daily Focus',
    'nav.stats': 'Statistics',
    'nav.settings': 'Settings',

    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.overview': 'Your Task Overview',
    'dashboard.stats.completion': 'Completion Rate',
    'dashboard.stats.active': 'Active Tasks',
    'dashboard.stats.overdue': 'Overdue',
    'dashboard.quadrants': 'Priority Quadrants',
    'dashboard.q1': 'Q1: Urgent & Important',
    'dashboard.q2': 'Q2: Not Urgent but Important',
    'dashboard.q3': 'Q3: Urgent but Not Important',
    'dashboard.q4': 'Q4: Not Urgent & Not Important',

    // Tasks Page
    'tasks.title': 'Your Tasks',
    'tasks.add': 'Add Task',
    'tasks.search': 'Search tasks...',
    'tasks.filter.all': 'All',
    'tasks.filter.active': 'Active',
    'tasks.filter.completed': 'Completed',
    'tasks.empty': 'No tasks yet. Add a task to get started!',

    // Task Card
    'task.edit': 'Edit Task',
    'task.delete': 'Delete',
    'task.done': 'Done',
    'task.undo': 'Undo',
    'task.save': 'Save',
    'task.cancel': 'Cancel',
    'task.due.today': 'Due today',
    'task.due.overdue': 'Overdue',

    // Task Form
    'form.title.new': 'New Task',
    'form.title.label': 'Title',
    'form.description.label': 'Description',
    'form.dueDate.label': 'Due Date',
    'form.priority.label': 'Urgency Level (1-10)',
    'form.impact.label': 'Impact Level (1-10)',
    'form.quadrant.label': 'Eisenhower Quadrant',
    'form.quadrant.auto': 'Auto-calculate based on Urgency & Impact',

    // Focus Page
    'focus.title': 'Daily Focus',
    'focus.subtitle': 'Top priority tasks across all quadrants, sorted by urgency score',
    'focus.budget.title': 'TIME BUDGET',
    'focus.budget.subtitle': 'Estimated time for current focus set',
    'focus.count.title': 'FOCUS TASK COUNT',
    'focus.count.subtitle': 'Currently showing {count} tasks',
    'focus.empty': 'No active tasks right now. Add or reopen tasks to build your next focus session.',

    // Pomodoro
    'pomodoro.title': 'Pomodoro Timer',
    'pomodoro.focus': 'Focus Session',
    'pomodoro.break': 'Break',
    'pomodoro.start': 'Start',
    'pomodoro.pause': 'Pause',
    'pomodoro.reset': 'Reset',
    'pomodoro.sound.label': 'Background Sound',
    'pomodoro.sound.none': 'None',

    // Settings
    'settings.title': 'Settings',
    'settings.data.clear.title': 'Are you sure?',
    'settings.data.clear.desc': 'This will permanently delete all your tasks. This action cannot be undone.',
    'settings.data.clear.cancel': 'Cancel',
    'settings.integrations': 'Integrations',
    'settings.spotify.enable': 'Enable Spotify Player',
    'settings.spotify.desc': 'Show Spotify music player.',
    'settings.spotify.req': 'Requires a Spotify Premium account.',
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.system': 'System',
    'settings.language': 'Language',
    'settings.language.id': 'Bahasa Indonesia',
    'settings.language.en': 'English',
    'settings.pomodoro': 'Pomodoro Settings',
    'settings.pomodoro.focus': 'Focus Duration (minutes)',
    'settings.pomodoro.break': 'Break Duration (minutes)',
    'settings.account': 'Account',
    'settings.account.logout': 'Sign out',

    // Context Menu
    'auth.login': 'Sign in to Quadrant',
    'auth.signup': 'Create an account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.submit.login': 'Sign In',
    'auth.submit.signup': 'Sign Up',
    'auth.toggle.login': 'Already have an account? Sign in',
    'auth.toggle.signup': 'Don\'t have an account? Sign up'
  }
};

export type TranslationKey = keyof typeof dictionaries['en'];
