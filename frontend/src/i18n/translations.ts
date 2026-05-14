export type LangCode = 'ko' | 'en' | 'ja' | 'zh';

interface Translations {
  nav: { home: string; categories: string; profile: string; logout: string; darkMode: string; lightMode: string; language: string; };
  auth: { registerTitle: string; loginTitle: string; email: string; password: string; confirmPassword: string; name: string; registerBtn: string; loginBtn: string; goLogin: string; goRegister: string; emailInvalid: string; passwordMin: string; passwordMismatch: string; emailDuplicate: string; invalidCredentials: string; };
  todo: { calendarView: string; listView: string; addBtn: string; createTitle: string; editTitle: string; titleLabel: string; titleRequired: string; descLabel: string; dueDateLabel: string; categoryLabel: string; categoryRequired: string; save: string; cancel: string; noTodos: string; noFilteredTodos: string; loadError: string; retry: string; deleteConfirmTitle: string; deleteConfirmBody: string; confirm: string; filterCategory: string; filterDateFrom: string; filterDateTo: string; filterAll: string; filterActive: string; filterCompleted: string; filterReset: string; dateRangeError: string; selectCategory: string; };
  category: { pageTitle: string; defaultSection: string; customSection: string; nameLabel: string; namePlaceholder: string; addBtn: string; edit: string; save: string; cancel: string; delete: string; defaultBadge: string; noCustom: string; deleteConfirmTitle: string; deleteConfirmBody: string; };
  profile: { pageTitle: string; nameLabel: string; newPassword: string; confirmPassword: string; save: string; saved: string; passwordMismatch: string; noChanges: string; languageLabel: string; };
  common: { loading: string; error: string; retry: string; required: string; };
  calendar: { weekdays: string[]; months: string[]; prev: string; next: string; };
  lang: { ko: string; en: string; ja: string; zh: string; };
}

export const translations: Record<LangCode, Translations> = {
  ko: {
    nav: { home: '홈', categories: '카테고리', profile: '프로필', logout: '로그아웃', darkMode: '다크 모드', lightMode: '라이트 모드', language: '언어' },
    auth: { registerTitle: '회원가입', loginTitle: '로그인', email: '이메일', password: '비밀번호', confirmPassword: '비밀번호 확인', name: '이름', registerBtn: '가입하기', loginBtn: '로그인', goLogin: '이미 계정이 있으신가요? 로그인', goRegister: '계정이 없으신가요? 회원가입', emailInvalid: '올바른 이메일 주소를 입력해 주세요.', passwordMin: '비밀번호는 8자 이상이어야 합니다.', passwordMismatch: '비밀번호가 일치하지 않습니다.', emailDuplicate: '이미 사용 중인 이메일입니다.', invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.' },
    todo: { calendarView: '달력', listView: '목록', addBtn: '+ 할일 등록', createTitle: '할일 등록', editTitle: '할일 수정', titleLabel: '제목', titleRequired: '제목은 필수 항목입니다.', descLabel: '설명', dueDateLabel: '마감일', categoryLabel: '카테고리', categoryRequired: '카테고리를 선택해 주세요.', save: '저장', cancel: '취소', noTodos: '등록된 할일이 없습니다.', noFilteredTodos: '필터 조건에 맞는 할일이 없습니다.', loadError: '할일 목록을 불러오지 못했습니다.', retry: '다시 시도', deleteConfirmTitle: '할일 삭제', deleteConfirmBody: '이 할일을 삭제하시겠습니까?', confirm: '삭제', filterCategory: '카테고리', filterDateFrom: '시작일', filterDateTo: '종료일', filterAll: '전체', filterActive: '미완료', filterCompleted: '완료', filterReset: '초기화', dateRangeError: '시작일이 종료일보다 늦을 수 없습니다.', selectCategory: '카테고리 선택' },
    category: { pageTitle: '카테고리 관리', defaultSection: '기본 카테고리 (수정/삭제 불가)', customSection: '사용자 정의 카테고리', nameLabel: '새 카테고리 이름', namePlaceholder: '카테고리 이름 입력', addBtn: '추가', edit: '수정', save: '저장', cancel: '취소', delete: '삭제', defaultBadge: '기본', noCustom: '사용자 정의 카테고리가 없습니다.', deleteConfirmTitle: '카테고리 삭제', deleteConfirmBody: '이 카테고리를 삭제하시겠습니까?' },
    profile: { pageTitle: '개인정보 수정', nameLabel: '이름', newPassword: '새 비밀번호', confirmPassword: '비밀번호 확인', save: '저장', saved: '저장이 완료되었습니다.', passwordMismatch: '비밀번호가 일치하지 않습니다.', noChanges: '변경된 내용이 없습니다.', languageLabel: '언어' },
    common: { loading: '로딩 중...', error: '오류가 발생했습니다.', retry: '다시 시도', required: '필수' },
    calendar: { weekdays: ['일', '월', '화', '수', '목', '금', '토'], months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'], prev: '이전 달', next: '다음 달' },
    lang: { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' },
  },
  en: {
    nav: { home: 'Home', categories: 'Categories', profile: 'Profile', logout: 'Logout', darkMode: 'Dark Mode', lightMode: 'Light Mode', language: 'Language' },
    auth: { registerTitle: 'Sign Up', loginTitle: 'Sign In', email: 'Email', password: 'Password', confirmPassword: 'Confirm Password', name: 'Name', registerBtn: 'Sign Up', loginBtn: 'Sign In', goLogin: 'Already have an account? Sign in', goRegister: "Don't have an account? Sign up", emailInvalid: 'Please enter a valid email address.', passwordMin: 'Password must be at least 8 characters.', passwordMismatch: 'Passwords do not match.', emailDuplicate: 'This email is already in use.', invalidCredentials: 'Invalid email or password.' },
    todo: { calendarView: 'Calendar', listView: 'List', addBtn: '+ Add Todo', createTitle: 'Add Todo', editTitle: 'Edit Todo', titleLabel: 'Title', titleRequired: 'Title is required.', descLabel: 'Description', dueDateLabel: 'Due Date', categoryLabel: 'Category', categoryRequired: 'Please select a category.', save: 'Save', cancel: 'Cancel', noTodos: 'No todos found.', noFilteredTodos: 'No todos match the current filter.', loadError: 'Failed to load todos.', retry: 'Retry', deleteConfirmTitle: 'Delete Todo', deleteConfirmBody: 'Are you sure you want to delete this todo?', confirm: 'Delete', filterCategory: 'Category', filterDateFrom: 'From', filterDateTo: 'To', filterAll: 'All', filterActive: 'Active', filterCompleted: 'Completed', filterReset: 'Reset', dateRangeError: 'Start date cannot be after end date.', selectCategory: 'Select category' },
    category: { pageTitle: 'Category Management', defaultSection: 'Default Categories (read-only)', customSection: 'Custom Categories', nameLabel: 'New Category Name', namePlaceholder: 'Enter category name', addBtn: 'Add', edit: 'Edit', save: 'Save', cancel: 'Cancel', delete: 'Delete', defaultBadge: 'Default', noCustom: 'No custom categories yet.', deleteConfirmTitle: 'Delete Category', deleteConfirmBody: 'Are you sure you want to delete this category?' },
    profile: { pageTitle: 'Edit Profile', nameLabel: 'Name', newPassword: 'New Password', confirmPassword: 'Confirm Password', save: 'Save', saved: 'Saved successfully.', passwordMismatch: 'Passwords do not match.', noChanges: 'No changes to save.', languageLabel: 'Language' },
    common: { loading: 'Loading...', error: 'An error occurred.', retry: 'Retry', required: 'Required' },
    calendar: { weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], prev: 'Prev', next: 'Next' },
    lang: { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' },
  },
  ja: {
    nav: { home: 'ホーム', categories: 'カテゴリ', profile: 'プロフィール', logout: 'ログアウト', darkMode: 'ダークモード', lightMode: 'ライトモード', language: '言語' },
    auth: { registerTitle: '新規登録', loginTitle: 'ログイン', email: 'メールアドレス', password: 'パスワード', confirmPassword: 'パスワード確認', name: '名前', registerBtn: '登録する', loginBtn: 'ログイン', goLogin: 'すでにアカウントをお持ちの方はこちら', goRegister: 'アカウントをお持ちでない方はこちら', emailInvalid: '正しいメールアドレスを入力してください。', passwordMin: 'パスワードは8文字以上で入力してください。', passwordMismatch: 'パスワードが一致しません。', emailDuplicate: 'このメールアドレスはすでに使用されています。', invalidCredentials: 'メールアドレスまたはパスワードが正しくありません。' },
    todo: { calendarView: 'カレンダー', listView: 'リスト', addBtn: '+ タスクを追加', createTitle: 'タスクを追加', editTitle: 'タスクを編集', titleLabel: 'タイトル', titleRequired: 'タイトルは必須です。', descLabel: '説明', dueDateLabel: '期限', categoryLabel: 'カテゴリ', categoryRequired: 'カテゴリを選択してください。', save: '保存', cancel: 'キャンセル', noTodos: 'タスクがありません。', noFilteredTodos: '条件に合うタスクがありません。', loadError: 'タスクの読み込みに失敗しました。', retry: '再試行', deleteConfirmTitle: 'タスクを削除', deleteConfirmBody: 'このタスクを削除しますか？', confirm: '削除', filterCategory: 'カテゴリ', filterDateFrom: '開始日', filterDateTo: '終了日', filterAll: 'すべて', filterActive: '未完了', filterCompleted: '完了', filterReset: 'リセット', dateRangeError: '開始日は終了日より前である必要があります。', selectCategory: 'カテゴリを選択' },
    category: { pageTitle: 'カテゴリ管理', defaultSection: 'デフォルトカテゴリ（編集・削除不可）', customSection: 'カスタムカテゴリ', nameLabel: '新しいカテゴリ名', namePlaceholder: 'カテゴリ名を入力', addBtn: '追加', edit: '編集', save: '保存', cancel: 'キャンセル', delete: '削除', defaultBadge: 'デフォルト', noCustom: 'カスタムカテゴリはまだありません。', deleteConfirmTitle: 'カテゴリを削除', deleteConfirmBody: 'このカテゴリを削除しますか？' },
    profile: { pageTitle: 'プロフィール編集', nameLabel: '名前', newPassword: '新しいパスワード', confirmPassword: 'パスワード確認', save: '保存', saved: '保存が完了しました。', passwordMismatch: 'パスワードが一致しません。', noChanges: '変更がありません。', languageLabel: '言語' },
    common: { loading: '読み込み中...', error: 'エラーが発生しました。', retry: '再試行', required: '必須' },
    calendar: { weekdays: ['日', '月', '火', '水', '木', '金', '土'], months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], prev: '前月', next: '次月' },
    lang: { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' },
  },
  zh: {
    nav: { home: '首页', categories: '分类', profile: '个人资料', logout: '退出登录', darkMode: '深色模式', lightMode: '浅色模式', language: '语言' },
    auth: { registerTitle: '注册', loginTitle: '登录', email: '邮箱', password: '密码', confirmPassword: '确认密码', name: '姓名', registerBtn: '注册', loginBtn: '登录', goLogin: '已有账号？去登录', goRegister: '没有账号？去注册', emailInvalid: '请输入正确的邮箱地址。', passwordMin: '密码至少需要8个字符。', passwordMismatch: '两次密码不一致。', emailDuplicate: '该邮箱已被注册。', invalidCredentials: '邮箱或密码不正确。' },
    todo: { calendarView: '日历', listView: '列表', addBtn: '+ 添加任务', createTitle: '添加任务', editTitle: '编辑任务', titleLabel: '标题', titleRequired: '标题不能为空。', descLabel: '描述', dueDateLabel: '截止日期', categoryLabel: '分类', categoryRequired: '请选择分类。', save: '保存', cancel: '取消', noTodos: '暂无任务。', noFilteredTodos: '没有符合条件的任务。', loadError: '加载任务失败。', retry: '重试', deleteConfirmTitle: '删除任务', deleteConfirmBody: '确定要删除这个任务吗？', confirm: '删除', filterCategory: '分类', filterDateFrom: '开始日期', filterDateTo: '结束日期', filterAll: '全部', filterActive: '未完成', filterCompleted: '已完成', filterReset: '重置', dateRangeError: '开始日期不能晚于结束日期。', selectCategory: '选择分类' },
    category: { pageTitle: '分类管理', defaultSection: '默认分类（不可编辑/删除）', customSection: '自定义分类', nameLabel: '新分类名称', namePlaceholder: '输入分类名称', addBtn: '添加', edit: '编辑', save: '保存', cancel: '取消', delete: '删除', defaultBadge: '默认', noCustom: '暂无自定义分类。', deleteConfirmTitle: '删除分类', deleteConfirmBody: '确定要删除此分类吗？' },
    profile: { pageTitle: '编辑个人资料', nameLabel: '姓名', newPassword: '新密码', confirmPassword: '确认密码', save: '保存', saved: '保存成功。', passwordMismatch: '两次密码不一致。', noChanges: '没有需要保存的更改。', languageLabel: '语言' },
    common: { loading: '加载中...', error: '发生错误。', retry: '重试', required: '必填' },
    calendar: { weekdays: ['日', '一', '二', '三', '四', '五', '六'], months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], prev: '上个月', next: '下个月' },
    lang: { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' },
  },
};
