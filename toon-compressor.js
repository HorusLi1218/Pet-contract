/**
 * ==========================================================================
 * TOON (Tiny Object Notation) - JSON 压缩/解压缩工具
 * 用于节省网络传输量，将大型 JSON 转换为精简格式
 * ==========================================================================
 */

class TOONCompressor {
    constructor() {
        // 定义字段映射表（完整字段名 -> 短代码）
        this.fieldMap = {
            // 飼主資料
            'owner_name': 'on',
            'email': 'em',
            'id_number': 'id',
            'phone': 'ph',
            'address': 'ad',
            'emergency_name': 'en',
            'emergency_tel': 'et',
            'clinic': 'cl',
            
            // 寵物資料
            'pet_name': 'pn',
            'breed': 'br',
            'color': 'co',
            'chip_no': 'ch',
            'sex': 'sx',
            'fix': 'fx',
            
            // 性格資料
            'p_human': 'ph',
            'p_dog': 'pd',
            'p_atk': 'pa',
            'p_ill': 'pi',
            'ill_detail': 'il',
            
            // 服務內容
            'services': 'sv',
            'pickup_time': 'pt',
            'price': 'pr',
            
            // 其他
            'signature': 'sg',
            'created_at': 'ca',
            'updated_at': 'ua',
            'contract_id': 'ci',
            'status': 'st'
        };
        
        // 创建反向映射表（短代码 -> 完整字段名）
        this.reverseMap = Object.fromEntries(
            Object.entries(this.fieldMap).map(([k, v]) => [v, k])
        );
        
        // 常见值的压缩映射
        this.valueMap = {
            '親人': '1',
            '普通': '2',
            '怕生': '3',
            '兇': '4',
            '友善': '5',
            '無': '0',
            '有': '1',
            '是': 'y',
            '否': 'n',
            '公': 'm',
            '母': 'f',
            '已結紮': 'y',
            '未結紮': 'n'
        };
        
        this.reverseValueMap = Object.fromEntries(
            Object.entries(this.valueMap).map(([k, v]) => [v, k])
        );
    }
    
    /**
     * 压缩 JSON 对象为 TOON 格式
     * @param {Object} data - 原始 JSON 数据
     * @param {Object} options - 压缩选项
     * @returns {Object} 压缩后的数据
     */
    compress(data, options = {}) {
        const {
            compressValues = true,      // 是否压缩常见值
            removeEmpty = true,          // 是否移除空值
            compressSignature = true     // 是否压缩签名数据
        } = options;
        
        const compressed = {};
        
        for (const [key, value] of Object.entries(data)) {
            // 跳过空值
            if (removeEmpty && this._isEmpty(value)) {
                continue;
            }
            
            // 获取短代码
            const shortKey = this.fieldMap[key] || key;
            
            // 处理值
            let processedValue = value;
            
            // 压缩常见值
            if (compressValues && typeof value === 'string') {
                processedValue = this.valueMap[value] || value;
            }
            
            // 压缩签名（Base64）
            if (compressSignature && key === 'signature' && typeof value === 'string') {
                processedValue = this._compressSignature(value);
            }
            
            // 递归处理数组
            if (Array.isArray(value)) {
                processedValue = value.map(item => {
                    if (typeof item === 'object') {
                        return this.compress(item, options);
                    }
                    return compressValues && typeof item === 'string' 
                        ? (this.valueMap[item] || item) 
                        : item;
                });
            }
            
            // 递归处理嵌套对象
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                processedValue = this.compress(value, options);
            }
            
            compressed[shortKey] = processedValue;
        }
        
        return compressed;
    }
    
    /**
     * 解压缩 TOON 格式为完整 JSON
     * @param {Object} toonData - TOON 压缩数据
     * @param {Object} options - 解压选项
     * @returns {Object} 完整的 JSON 数据
     */
    decompress(toonData, options = {}) {
        const {
            decompressValues = true,
            decompressSignature = true
        } = options;
        
        const decompressed = {};
        
        for (const [shortKey, value] of Object.entries(toonData)) {
            // 获取完整字段名
            const fullKey = this.reverseMap[shortKey] || shortKey;
            
            // 处理值
            let processedValue = value;
            
            // 解压缩常见值
            if (decompressValues && typeof value === 'string') {
                processedValue = this.reverseValueMap[value] || value;
            }
            
            // 解压缩签名
            if (decompressSignature && fullKey === 'signature' && typeof value === 'string') {
                processedValue = this._decompressSignature(value);
            }
            
            // 递归处理数组
            if (Array.isArray(value)) {
                processedValue = value.map(item => {
                    if (typeof item === 'object') {
                        return this.decompress(item, options);
                    }
                    return decompressValues && typeof item === 'string'
                        ? (this.reverseValueMap[item] || item)
                        : item;
                });
            }
            
            // 递归处理嵌套对象
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                processedValue = this.decompress(value, options);
            }
            
            decompressed[fullKey] = processedValue;
        }
        
        return decompressed;
    }
    
    /**
     * 压缩签名 Base64 数据
     * @private
     */
    _compressSignature(base64String) {
        if (!base64String || !base64String.startsWith('data:image')) {
            return base64String;
        }
        
        // 移除 data:image/png;base64, 前缀，只保留数据部分
        const parts = base64String.split(',');
        if (parts.length === 2) {
            return parts[1]; // 只返回 Base64 数据部分
        }
        return base64String;
    }
    
    /**
     * 解压缩签名数据
     * @private
     */
    _decompressSignature(compressedString) {
        if (!compressedString) {
            return compressedString;
        }
        
        // 如果已经包含前缀，直接返回
        if (compressedString.startsWith('data:image')) {
            return compressedString;
        }
        
        // 添加回 data URL 前缀
        return `data:image/png;base64,${compressedString}`;
    }
    
    /**
     * 检查值是否为空
     * @private
     */
    _isEmpty(value) {
        if (value === null || value === undefined || value === '') {
            return true;
        }
        if (Array.isArray(value) && value.length === 0) {
            return true;
        }
        if (typeof value === 'object' && Object.keys(value).length === 0) {
            return true;
        }
        return false;
    }
    
    /**
     * 计算压缩率
     * @param {Object} original - 原始数据
     * @param {Object} compressed - 压缩后的数据
     * @returns {Object} 压缩统计信息
     */
    getCompressionStats(original, compressed) {
        const originalStr = JSON.stringify(original);
        const compressedStr = JSON.stringify(compressed);
        
        const originalSize = new Blob([originalStr]).size;
        const compressedSize = new Blob([compressedStr]).size;
        const savedBytes = originalSize - compressedSize;
        const compressionRatio = ((savedBytes / originalSize) * 100).toFixed(2);
        
        return {
            originalSize: this._formatBytes(originalSize),
            compressedSize: this._formatBytes(compressedSize),
            savedBytes: this._formatBytes(savedBytes),
            compressionRatio: `${compressionRatio}%`,
            originalSizeRaw: originalSize,
            compressedSizeRaw: compressedSize
        };
    }
    
    /**
     * 格式化字节大小
     * @private
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    /**
     * 添加自定义字段映射
     * @param {Object} customMap - 自定义映射表
     */
    addCustomMapping(customMap) {
        Object.assign(this.fieldMap, customMap);
        
        // 更新反向映射
        for (const [key, value] of Object.entries(customMap)) {
            this.reverseMap[value] = key;
        }
    }
    
    /**
     * 批量压缩多个对象
     * @param {Array} dataArray - 数据数组
     * @param {Object} options - 压缩选项
     * @returns {Array} 压缩后的数据数组
     */
    compressBatch(dataArray, options = {}) {
        return dataArray.map(data => this.compress(data, options));
    }
    
    /**
     * 批量解压缩
     * @param {Array} toonArray - TOON 数据数组
     * @param {Object} options - 解压选项
     * @returns {Array} 解压后的数据数组
     */
    decompressBatch(toonArray, options = {}) {
        return toonArray.map(toon => this.decompress(toon, options));
    }
}

// ==========================================================================
// 导出与使用示例
// ==========================================================================

// 创建全局实例
if (typeof window !== 'undefined') {
    window.TOONCompressor = TOONCompressor;
    window.toonCompressor = new TOONCompressor();
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TOONCompressor;
}

/**
 * 使用示例：
 * 
 * // 1. 压缩数据
 * const originalData = {
 *     owner_name: '王小明',
 *     email: 'test@example.com',
 *     phone: '0912345678',
 *     pet_name: '小白',
 *     sex: '公',
 *     fix: '已結紮',
 *     p_human: '親人',
 *     services: ['洗澡', '剪毛'],
 *     signature: 'data:image/png;base64,iVBORw0KG...'
 * };
 * 
 * const compressed = toonCompressor.compress(originalData);
 * console.log('压缩后:', compressed);
 * // 输出: { on: '王小明', em: 'test@example.com', ph: '0912345678', pn: '小白', sx: 'm', fx: 'y', ph: '1', sv: ['洗澡', '剪毛'], sg: 'iVBORw0KG...' }
 * 
 * // 2. 解压缩数据
 * const decompressed = toonCompressor.decompress(compressed);
 * console.log('解压缩后:', decompressed);
 * 
 * // 3. 查看压缩统计
 * const stats = toonCompressor.getCompressionStats(originalData, compressed);
 * console.log('压缩统计:', stats);
 * // 输出: { originalSize: '2.5 KB', compressedSize: '1.2 KB', savedBytes: '1.3 KB', compressionRatio: '52%' }
 * 
 * // 4. 在 API 传输中使用
 * async function saveContract(formData) {
 *     const compressed = toonCompressor.compress(formData);
 *     
 *     const response = await fetch('/api/contracts', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify(compressed)
 *     });
 *     
 *     return response.json();
 * }
 * 
 * // 5. 自定义字段映射
 * toonCompressor.addCustomMapping({
 *     'custom_field': 'cf',
 *     'another_field': 'af'
 * });
 */
