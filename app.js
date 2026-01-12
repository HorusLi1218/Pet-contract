/**
 * ==========================================================================
 * 可樂果寵物生活館 - 定型化契約簽署系統
 * JavaScript 主程式 v2.0
 * ==========================================================================
 */

// Supabase 配置
const SUPABASE_URL = '你的_SUPABASE_URL';
const SUPABASE_KEY = '你的_SUPABASE_KEY';
let supabase;

// 初始化 Supabase
if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ==========================================================================
// 主題切換功能
// ==========================================================================

/**
 * 初始化主題
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

/**
 * 切換深色/淺色模式
 */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // 添加平滑過渡動畫
    html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
}

/**
 * 更新主題圖示
 */
function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        if (theme === 'light') {
            icon.className = 'fas fa-sun text-orange-500 text-lg';
        } else {
            icon.className = 'fas fa-moon text-orange-500 text-lg';
        }
    }
}

// ==========================================================================
// 表單驗證功能
// ==========================================================================

/**
 * 驗證輸入欄位
 */
function validateInput(input, type) {
    const value = input.value.trim();
    let isValid = false;
    
    switch(type) {
        case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            break;
        case 'id':
            isValid = validateTaiwanID(value);
            break;
        case 'mobile':
            isValid = /^09\d{8}$/.test(value);
            break;
        case 'phone':
            isValid = /^0\d{8,9}$/.test(value);
            break;
        case 'chip':
            isValid = /^\d{10}$|^\d{15}$/.test(value);
            break;
        default:
            isValid = value.length > 0;
    }
    
    updateInputState(input, isValid);
    return isValid;
}

/**
 * 驗證台灣身分證字號
 */
function validateTaiwanID(id) {
    if (!/^[A-Z]\d{9}$/.test(id)) return false;
    
    const letterMap = {
        'A':10,'B':11,'C':12,'D':13,'E':14,'F':15,'G':16,'H':17,'I':34,'J':18,
        'K':19,'L':20,'M':21,'N':22,'O':35,'P':23,'Q':24,'R':25,'S':26,'T':27,
        'U':28,'V':29,'W':32,'X':30,'Y':31,'Z':33
    };
    
    const letter = letterMap[id[0]];
    const numbers = id.slice(1).split('').map(Number);
    
    const sum = Math.floor(letter / 10) + (letter % 10) * 9 +
                numbers[0] * 8 + numbers[1] * 7 + numbers[2] * 6 +
                numbers[3] * 5 + numbers[4] * 4 + numbers[5] * 3 +
                numbers[6] * 2 + numbers[7] * 1 + numbers[8];
    
    return sum % 10 === 0;
}

/**
 * 更新輸入框狀態
 */
function updateInputState(input, isValid) {
    input.classList.remove('input-valid', 'input-invalid');
    
    if (input.value.trim()) {
        if (isValid) {
            input.classList.add('input-valid');
        } else {
            input.classList.add('input-invalid');
        }
    }
}

// ==========================================================================
// 晶片狀態切換
// ==========================================================================

function toggleChipStatus(status) {
    const chipInput = document.getElementById('chip_no');
    
    if (status === 'unknown') {
        chipInput.value = '號碼不詳';
        chipInput.disabled = true;
        chipInput.classList.remove('input-invalid');
        chipInput.classList.add('input-valid');
    } else if (status === 'none') {
        chipInput.value = '無晶片';
        chipInput.disabled = true;
        chipInput.classList.remove('input-invalid');
        chipInput.classList.add('input-valid');
    } else {
        chipInput.value = '';
        chipInput.disabled = false;
        chipInput.classList.remove('input-valid', 'input-invalid');
    }
}

// ==========================================================================
// 病史詳情切換
// ==========================================================================

function toggleIllDetail(show) {
    const container = document.getElementById('ill_detail_container');
    const textarea = document.getElementById('ill_detail');
    
    if (show) {
        container.classList.add('open');
        textarea.required = true;
    } else {
        container.classList.remove('open');
        textarea.required = false;
        textarea.value = '';
    }
}

// ==========================================================================
// 簽名功能
// ==========================================================================

let signatureData = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

/**
 * 開啟全螢幕簽名模式
 */
function openSignature() {
    const modal = document.getElementById('sig-fullscreen-modal');
    const canvas = document.getElementById('fs-canvas');
    const hint = document.querySelector('.fs-hint');
    
    if (modal && canvas) {
        modal.style.display = 'flex';
        
        // 設置 canvas 尺寸
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // 初始化繪圖環境
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 綁定事件
        setupCanvasEvents(canvas, hint);
    }
}

/**
 * 設置 Canvas 事件
 */
function setupCanvasEvents(canvas, hint) {
    const ctx = canvas.getContext('2d');
    
    // 滑鼠事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // 觸控事件
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
        isDrawing = true;
        if (hint) hint.style.display = 'none';
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
    });
    
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = e.target.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    
    const hint = document.querySelector('.fs-hint');
    if (hint) hint.style.display = 'none';
}

function draw(e) {
    if (!isDrawing) return;
    
    const canvas = e.target;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

/**
 * 清除簽名
 */
function clearSignature() {
    const canvas = document.getElementById('fs-canvas');
    const ctx = canvas.getContext('2d');
    const hint = document.querySelector('.fs-hint');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (hint) hint.style.display = 'block';
    signatureData = null;
}

/**
 * 確認簽名
 */
function confirmSignature() {
    const canvas = document.getElementById('fs-canvas');
    const modal = document.getElementById('sig-fullscreen-modal');
    const preview = document.getElementById('sig-preview-img');
    const hint = document.querySelector('.signature-hint');
    
    // 轉換為圖片
    signatureData = canvas.toDataURL('image/png');
    
    // 顯示預覽
    if (preview) {
        preview.src = signatureData;
        preview.style.display = 'block';
    }
    
    if (hint) {
        hint.style.display = 'none';
    }
    
    // 關閉模態框
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 取消簽名
 */
function cancelSignature() {
    const modal = document.getElementById('sig-fullscreen-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==========================================================================
// 表單提交
// ==========================================================================

/**
 * 提交契約表單
 */
async function submitContract() {
    // 驗證表單
    if (!validateForm()) {
        alert('請填寫所有必填欄位');
        return;
    }
    
    // 驗證簽名
    if (!signatureData) {
        alert('請先完成簽名');
        return;
    }
    
    // 收集表單資料
    const formData = collectFormData();
    
    // 使用 TOON 壓縮數據
    let dataToSend = formData;
    let compressionStats = null;
    
    if (window.toonCompressor) {
        dataToSend = window.toonCompressor.compress(formData, {
            compressValues: true,
            removeEmpty: true,
            compressSignature: true
        });
        
        // 計算壓縮統計（開發模式）
        compressionStats = window.toonCompressor.getCompressionStats(formData, dataToSend);
        console.log('📦 TOON 壓縮統計:', compressionStats);
        console.log('原始數據大小:', compressionStats.originalSize);
        console.log('壓縮後大小:', compressionStats.compressedSize);
        console.log('節省:', compressionStats.savedBytes, `(${compressionStats.compressionRatio})`);
    }
    
    // 顯示載入中
    showLoading(true);
    
    try {
        // 發送壓縮後的數據到 Supabase 或後端 API
        // const { data, error } = await supabase.from('contracts').insert([dataToSend]);
        
        // 或使用 Fetch API
        // const response = await fetch('/api/contracts', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'X-Compression': 'TOON' // 告訴後端使用了壓縮
        //     },
        //     body: JSON.stringify(dataToSend)
        // });
        
        // 模擬提交
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 成功提示
        let successMsg = '契約已成功提交！';
        if (compressionStats) {
            successMsg += `\n\n💾 已節省 ${compressionStats.compressionRatio} 的傳輸量`;
        }
        showSuccess(successMsg);
        
        // 重置表單
        setTimeout(() => {
            resetForm();
        }, 2000);
        
    } catch (error) {
        console.error('提交失敗:', error);
        alert('提交失敗，請稍後再試');
    } finally {
        showLoading(false);
    }
}

/**
 * 驗證表單
 */
function validateForm() {
    const requiredFields = document.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('input-invalid');
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * 收集表單資料
 */
function collectFormData() {
    return {
        // 飼主資料
        owner_name: document.getElementById('owner_name')?.value,
        email: document.getElementById('email')?.value,
        id_number: document.getElementById('id_number')?.value,
        phone: document.getElementById('phone')?.value,
        address: document.getElementById('address')?.value,
        emergency_name: document.getElementById('emergency_name')?.value,
        emergency_tel: document.getElementById('emergency_tel')?.value,
        clinic: document.getElementById('clinic')?.value,
        
        // 寵物資料
        pet_name: document.getElementById('pet_name')?.value,
        breed: document.getElementById('breed')?.value,
        color: document.getElementById('color')?.value,
        chip_no: document.getElementById('chip_no')?.value,
        sex: document.querySelector('input[name="sex"]:checked')?.value,
        fix: document.querySelector('input[name="fix"]:checked')?.value,
        
        // 性格資料
        p_human: document.querySelector('input[name="p_human"]:checked')?.value,
        p_dog: document.querySelector('input[name="p_dog"]:checked')?.value,
        p_atk: document.querySelector('input[name="p_atk"]:checked')?.value,
        p_ill: document.querySelector('input[name="p_ill"]:checked')?.value,
        ill_detail: document.getElementById('ill_detail')?.value,
        
        // 服務內容
        services: Array.from(document.querySelectorAll('input[name="service"]:checked')).map(cb => cb.value),
        pickup_time: document.getElementById('pickup_time')?.value,
        price: document.getElementById('price')?.value,
        
        // 簽名
        signature: signatureData,
        
        // 時間戳記
        created_at: new Date().toISOString()
    };
}

/**
 * 重置表單
 */
function resetForm() {
    document.getElementById('contract-form')?.reset();
    signatureData = null;
    
    const preview = document.getElementById('sig-preview-img');
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }
    
    const hint = document.querySelector('.signature-hint');
    if (hint) {
        hint.style.display = 'flex';
    }
    
    // 清除驗證狀態
    document.querySelectorAll('.input-valid, .input-invalid').forEach(input => {
        input.classList.remove('input-valid', 'input-invalid');
    });
}

// ==========================================================================
// UI 輔助功能
// ==========================================================================

function showLoading(show) {
    // 實作載入動畫
    console.log('Loading:', show);
}

function showSuccess(message) {
    alert(message);
}

// ==========================================================================
// 管理員功能
// ==========================================================================

function checkAdmin() {
    const password = prompt('請輸入管理員密碼：');
    if (password === 'admin123') {
        showAdminView();
    }
}

function showAdminView() {
    document.getElementById('clientView')?.style.setProperty('display', 'none');
    document.getElementById('adminView')?.style.setProperty('display', 'block');
}

function showClientView() {
    document.getElementById('adminView')?.style.setProperty('display', 'none');
    document.getElementById('clientView')?.style.setProperty('display', 'block');
}

// ==========================================================================
// 數字輸入限制
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 限制數字輸入
    document.querySelectorAll('.num-only').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    });
    
    // 其他服務項目顯示/隱藏
    const otherTrig = document.getElementById('other_trig');
    const otherVal = document.getElementById('other_val');
    
    if (otherTrig && otherVal) {
        otherTrig.addEventListener('change', (e) => {
            if (e.target.checked) {
                otherVal.classList.remove('hidden');
                otherVal.focus();
            } else {
                otherVal.classList.add('hidden');
                otherVal.value = '';
            }
        });
    }
    
    // 初始化主題
    initTheme();
});

// ==========================================================================
// 全域函數導出
// ==========================================================================

window.toggleTheme = toggleTheme;
window.validateInput = validateInput;
window.toggleChipStatus = toggleChipStatus;
window.toggleIllDetail = toggleIllDetail;
window.openSignature = openSignature;
window.clearSignature = clearSignature;
window.confirmSignature = confirmSignature;
window.cancelSignature = cancelSignature;
window.submitContract = submitContract;
window.checkAdmin = checkAdmin;
window.showClientView = showClientView;
