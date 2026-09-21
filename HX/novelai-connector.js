/**
 * SD Helper - NovelAI 连接器
 * 支持直接调用 NovelAI 官方 API（直连模式）与各类第三方反代中转站
 * 
 * 特性支持：
 * - 支持自定义 API 地址 (Base URL)，无缝接入官方服务及第三方中转站
 * - 兼容官方 pst- 持久令牌及各类第三方 API Key
 * - 智能多格式图像解析：原生 ZIP 压缩包、PNG/JPEG/WebP 二进制流及 JSON 格式自适应提取
 * - 质量词与负向预设 (Quality Tags & UC Presets) 的模型自适应（支持用户自主选择是否开启）
 */

const NovelAIConnector = {
    id: 'novelai',
    version: '2.4.0',
    name: 'NovelAI',
    description: '连接 NovelAI 图像生成服务（支持直连与第三方中转站）',
    icon: '<i class="fa-solid fa-palette"></i>',

    // 可用模型
    MODELS: [
        { id: 'nai-diffusion-5-full', name: 'NAI Diffusion V5 Full (最新)' },
        { id: 'nai-diffusion-5-curated', name: 'NAI Diffusion V5 Curated' },
        { id: 'nai-diffusion-4-5-full', name: 'NAI Diffusion V4.5 Full' },
        { id: 'nai-diffusion-4-5-curated', name: 'NAI Diffusion V4.5 Curated' },
        { id: 'nai-diffusion-4-curated-preview', name: 'NAI Diffusion V4 Curated' },
        { id: 'nai-diffusion-4-full', name: 'NAI Diffusion V4 Full' },
        { id: 'nai-diffusion-3', name: 'NAI Diffusion V3' },
        { id: 'nai-diffusion-furry-3', name: 'NAI Diffusion Furry V3' },
        { id: 'safe-diffusion', name: 'Safe Diffusion' },
        { id: 'furry-3', name: 'Furry V3' }
    ],

    // 可用采样器
    SAMPLERS: [
        { id: 'k_euler', name: 'Euler' },
        { id: 'k_euler_ancestral', name: 'Euler a' },
        { id: 'k_dpmpp_2m', name: 'DPM++ 2M' },
        { id: 'k_dpmpp_2m_ancestral', name: 'DPM++ 2M a' },
        { id: 'k_dpmpp_2m_sde', name: 'DPM++ 2M SDE' },
        { id: 'k_dpmpp_sde', name: 'DPM++ SDE' },
        { id: 'k_dpmpp_2s_ancestral', name: 'DPM++ 2S a' },
        { id: 'ddim', name: 'DDIM' }
    ],

    // 可用调度器
    SCHEDULERS: [
        { id: 'karras', name: 'Karras' },
        { id: 'normal', name: 'Normal' },
        { id: 'exponential', name: 'Exponential' },
        { id: 'polyexponential', name: 'Polyexponential' }
    ],

    // 完整分辨率预设 (注意: NovelAI 要求宽高必须是 64 的倍数)
    RESOLUTIONS: [
        // Opus 无限免费专区 (≤ 1MP)
        { w: 832, h: 1216, label: '832x1216 (13:19, 竖版推荐)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 1216, h: 832, label: '1216x832 (19:13, 横版推荐)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 1024, h: 1024, label: '1024x1024 (1:1, 正方推荐)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 768, h: 1344, label: '768x1344 (3:4, 竖版修长)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 1344, h: 768, label: '1344x768 (4:3, 横版画卷)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 896, h: 1152, label: '896x1152 (7:9, 黄金竖版)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 1152, h: 896, label: '1152x896 (9:7, 黄金横版)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 704, h: 1280, label: '704x1280 (9:16, 720p 手机壁纸)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 1280, h: 704, label: '1280x704 (16:9, 720p 电脑壁纸)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 640, h: 1536, label: '640x1536 (10:24, 全身立绘)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 1536, h: 640, label: '1536x640 (24:10, 超宽全景)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 576, h: 960, label: '576x960 (9:16, 极速壁纸)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 960, h: 576, label: '960x576 (16:9, 极速横版)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 512, h: 768, label: '512x768 (2:3, 传统竖版)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 768, h: 512, label: '768x512 (3:2, 传统横版)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 640, h: 640, label: '640x640 (1:1, 传统方形)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        { w: 512, h: 512, label: '512x512 (1:1, 极速小图)', group: '👑 Opus 免费专区 (≤ 1MP)' },
        // 超清/大图 (超过 1MP，生成需消耗点数)
        { w: 1088, h: 1920, label: '1088x1920 (9:16, 1080p 超清壁纸)', group: '💎 超清/大图 (消耗点数)' },
        { w: 1920, h: 1088, label: '1920x1088 (16:9, 1080p 超清横屏)', group: '💎 超清/大图 (消耗点数)' },
        { w: 1024, h: 1536, label: '1024x1536 (2:3, 高清大图)', group: '💎 超清/大图 (消耗点数)' },
        { w: 1536, h: 1024, label: '1536x1024 (3:2, 高清宽屏)', group: '💎 超清/大图 (消耗点数)' },
        { w: 1024, h: 1792, label: '1024x1792 (4:7, 特大立绘)', group: '💎 超清/大图 (消耗点数)' },
        { w: 1792, h: 1024, label: '1792x1024 (7:4, 特大全景)', group: '💎 超清/大图 (消耗点数)' }
    ],

    // ============ 核心方法 ============

    async _naiFetch(url, options = {}) {
        // 1. 优先使用浏览器原生 fetch（原生网络协议栈，性能最高，完全不受油猴/篡改猴扩展消息通道断开影响）
        try {
            const res = await fetch(url, options);
            return res;
        } catch (fetchErr) {
            console.warn('[NovelAI v2.4.0] 原生 fetch 失败（尝试 GM_xmlhttpRequest 备用通道）:', fetchErr.message);
        }

        // 2. 仅当原生 fetch 失败（如直连官方 image.novelai.net 缺乏 CORS 时），才回退到油猴 GM 越狱跨域
        let gmFn = null;
        try {
            if (typeof GM_xmlhttpRequest === 'function') gmFn = GM_xmlhttpRequest;
            else if (typeof window !== 'undefined' && typeof window.GM_xmlhttpRequest === 'function') gmFn = window.GM_xmlhttpRequest;
            else if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.GM_xmlhttpRequest === 'function') gmFn = unsafeWindow.GM_xmlhttpRequest;
        } catch (e) {}

        if (gmFn) {
            return new Promise((resolve, reject) => {
                try {
                    gmFn({
                        method: options.method || 'POST',
                        url: url,
                        headers: options.headers || {},
                        data: options.body || undefined,
                        responseType: options.responseType || undefined,
                        timeout: options.timeout || 60000,
                        onload: (res) => {
                            resolve({
                                ok: res.status >= 200 && res.status < 300,
                                status: res.status,
                                statusText: res.statusText,
                                text: () => Promise.resolve(res.responseText),
                                json: () => {
                                    try { return Promise.resolve(JSON.parse(res.responseText)); }
                                    catch (e) { return Promise.reject(new Error('Invalid JSON: ' + (res.responseText || '').substring(0, 100))); }
                                },
                                arrayBuffer: () => {
                                    if (res.response instanceof ArrayBuffer) return Promise.resolve(res.response);
                                    const str = res.responseText || '';
                                    const buf = new ArrayBuffer(str.length);
                                    const bufView = new Uint8Array(buf);
                                    for (let i = 0, strLen = str.length; i < strLen; i++) {
                                        bufView[i] = str.charCodeAt(i) & 0xff;
                                    }
                                    return Promise.resolve(buf);
                                }
                            });
                        },
                        onerror: (err) => reject(new Error(`网络错误 (GM): ${err.error || err.statusText || 'CORS/跨域或代理网络异常'}`)),
                        ontimeout: () => reject(new Error('请求超时 (NovelAI 连接无响应)'))
                    });
                } catch (gmCallErr) {
                    reject(gmCallErr);
                }
            });
        }

        return fetch(url, options);
    },

    /**
     * 规范化获取生成图像的完整 API 端点
     * 兼容官方默认、自定义 Base URL、带 /v1 后缀或直接输入 /ai/generate-image 的各类中转站
     */
    getGenerateImageUrl(config) {
        let base = (config && config.baseUrl ? config.baseUrl : '').trim();
        if (!base) {
            return 'https://image.novelai.net/ai/generate-image';
        }
        base = base.replace(/\/+$/, '');
        if (base.endsWith('/ai/generate-image')) {
            return base;
        }
        if (base.endsWith('/generate-image')) {
            return base;
        }
        if (base.endsWith('/v1')) {
            base = base.slice(0, -3);
        }
        return `${base}/ai/generate-image`;
    },

    async testConnection(config) {
        console.log('[NovelAI] 测试连接...');

        if (!config.apiToken) {
            return { success: false, message: '请配置 API Token / 中转 Key' };
        }

        const isOfficial = !config.baseUrl || config.baseUrl.includes('novelai.net');
        // 官方直连模式下提醒 pst- 格式；配置中转站模式下允许任意自定义 Key (如 sk-xxxx 等)
        if (isOfficial && !config.apiToken.startsWith('pst-')) {
            return { success: false, message: '官方直连 Token 格式错误，应以 pst- 开头。若使用第三方中转站，请在上方输入 API 地址。' };
        }

        const url = this.getGenerateImageUrl(config);
        console.log('[NovelAI] 测试连接端点:', url);

        // 真正调用 API 验证 Token / Key
        try {
            const response = await this._naiFetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiToken}`
                },
                body: JSON.stringify({ input: '', model: 'test', parameters: {} })
            });

            if (response.status === 401 || response.status === 403) {
                return { success: false, message: '密钥无效或已过期 (HTTP 401/403)，请检查 Token / Key' };
            }

            if (response.status === 404) {
                return { success: false, message: `接口地址不存在 (HTTP 404)，请检查中转站 API 地址是否正确 (${url})` };
            }

            if (response.status === 400 || response.ok) {
                let hostDesc = isOfficial ? 'NovelAI 官方' : '第三方中转站';
                try {
                    const parsedUrl = new URL(url);
                    if (parsedUrl.host) hostDesc += ` (${parsedUrl.host})`;
                } catch (err) {}
                return { success: true, message: `连接成功！已连通 ${hostDesc}，鉴权有效！` };
            }

            return { success: false, message: `连接异常 (HTTP ${response.status})` };
        } catch (e) {
            return { success: false, message: `网络错误: ${e.message}` };
        }
    },

    async generate(prompt, negative, params, config) {
        console.log('[NovelAI] 生成图片...');
        console.log('[NovelAI] 正向提示词:', prompt);

        if (!config.apiToken) {
            return { success: false, error: '请配置 API Token' };
        }

        try {
            const c = { ...this.getDefaultConfig(), ...config };
            const p = c.defaultParams || {};

            // 添加提示词前缀
            const finalPrompt = c.promptPrefix
                ? `${c.promptPrefix.trim()}, ${prompt}`.replace(/,\s*,/g, ',').trim()
                : prompt;

            // 多角色分层与空间坐标解析 (V4/V4.5/V5 Multi-Character Prompting & Visual Grid Coords)
            let baseCaption = finalPrompt;
            const charCaptions = [];
            let useCoords = false;
            
            if (p.v4MultiChar !== false) {
                const charRegex = /<char(?:\s+([^>]*))?>([\s\S]*?)<\/char>/gi;
                const rawMatches = [];
                let match;
                
                while ((match = charRegex.exec(finalPrompt)) !== null) {
                    if (match[2] && match[2].trim()) {
                        rawMatches.push({
                            attrs: match[1] || '',
                            content: match[2].trim()
                        });
                    }
                }
                
                if (rawMatches.length > 0) {
                    const posMap = {
                        'left': { x: 0.3, y: 0.5 },
                        'l': { x: 0.3, y: 0.5 },
                        '左': { x: 0.3, y: 0.5 },
                        'right': { x: 0.7, y: 0.5 },
                        'r': { x: 0.7, y: 0.5 },
                        '右': { x: 0.7, y: 0.5 },
                        'center': { x: 0.5, y: 0.5 },
                        'c': { x: 0.5, y: 0.5 },
                        'mid': { x: 0.5, y: 0.5 },
                        'middle': { x: 0.5, y: 0.5 },
                        '中': { x: 0.5, y: 0.5 },
                        'top-left': { x: 0.3, y: 0.3 },
                        'tl': { x: 0.3, y: 0.3 },
                        '左上': { x: 0.3, y: 0.3 },
                        'top-right': { x: 0.7, y: 0.3 },
                        'tr': { x: 0.7, y: 0.3 },
                        '右上': { x: 0.7, y: 0.3 },
                        'top': { x: 0.5, y: 0.3 },
                        't': { x: 0.5, y: 0.3 },
                        '上': { x: 0.5, y: 0.3 },
                        'bottom-left': { x: 0.3, y: 0.7 },
                        'bl': { x: 0.3, y: 0.7 },
                        '左下': { x: 0.3, y: 0.7 },
                        'bottom-right': { x: 0.7, y: 0.7 },
                        'br': { x: 0.7, y: 0.7 },
                        '右下': { x: 0.7, y: 0.7 },
                        'bottom': { x: 0.5, y: 0.7 },
                        'b': { x: 0.5, y: 0.7 },
                        '下': { x: 0.5, y: 0.7 }
                    };

                    const total = rawMatches.length;
                    rawMatches.forEach((item, idx) => {
                        const attrs = item.attrs;
                        let coords = null;

                        // 1. 解析 pos 属性 (支持 left/right/center 或 "0.3,0.5")
                        const posMatch = attrs.match(/\bpos\s*=\s*["']?([^"'\s>]+)["']?/i);
                        if (posMatch) {
                            const val = posMatch[1].toLowerCase().trim();
                            if (posMap[val]) {
                                coords = { ...posMap[val] };
                            } else if (val.includes(',')) {
                                const [px, py] = val.split(',').map(n => parseFloat(n.trim()));
                                if (!isNaN(px) && !isNaN(py)) {
                                    coords = { x: Math.max(0, Math.min(1, px)), y: Math.max(0, Math.min(1, py)) };
                                }
                            }
                        }

                        // 2. 解析单独的 x 与 y 属性 (如 x="0.25" y="0.5")
                        if (!coords) {
                            const xMatch = attrs.match(/\bx\s*=\s*["']?([^"'\s>]+)["']?/i);
                            const yMatch = attrs.match(/\by\s*=\s*["']?([^"'\s>]+)["']?/i);
                            if (xMatch || yMatch) {
                                const px = xMatch ? parseFloat(xMatch[1]) : 0.5;
                                const py = yMatch ? parseFloat(yMatch[1]) : 0.5;
                                if (!isNaN(px) && !isNaN(py)) {
                                    coords = { x: Math.max(0, Math.min(1, px)), y: Math.max(0, Math.min(1, py)) };
                                }
                            }
                        }

                        // 3. 多角色自动横向均布 (防止多人同框重叠)
                        if (!coords) {
                            if (total === 1) {
                                coords = { x: 0.5, y: 0.5 };
                            } else if (total === 2) {
                                coords = idx === 0 ? { x: 0.3, y: 0.5 } : { x: 0.7, y: 0.5 };
                            } else if (total === 3) {
                                coords = idx === 0 ? { x: 0.2, y: 0.5 } : (idx === 1 ? { x: 0.5, y: 0.5 } : { x: 0.8, y: 0.5 });
                            } else {
                                coords = { x: Math.round(((idx + 0.5) / total) * 100) / 100, y: 0.5 };
                            }
                        }

                        charCaptions.push({
                            char_caption: item.content,
                            centers: [coords]
                        });
                    });

                    useCoords = charCaptions.length > 0;
                    baseCaption = baseCaption.replace(/<char(?:\s+[^>]*)?>[\s\S]*?<\/char>/gi, '').replace(/,\s*,/g, ',').trim();
                    baseCaption = baseCaption.replace(/^,|,$/g, '').trim();
                }
            }

            const finalNegative = negative || c.undesiredContent || '';

            // 64像素对齐保护
            const rawWidth = params.width || p.width || 832;
            const rawHeight = params.height || p.height || 1216;
            const width = Math.max(64, Math.round(rawWidth / 64) * 64);
            const height = Math.max(64, Math.round(rawHeight / 64) * 64);

            // seed 处理：-1 或未定义时随机生成
            const inputSeed = params.seed !== undefined ? params.seed : (p.seed !== undefined ? p.seed : -1);
            const seed = (inputSeed >= 0) ? inputSeed : Math.floor(Math.random() * 4294967295);

            const modelName = c.model || 'nai-diffusion-5-full';
            const isV5 = modelName.includes('nai-diffusion-5');
            const isV45 = modelName.includes('nai-diffusion-4-5');
            const isV4 = modelName.includes('nai-diffusion-4') || isV45;
            const isV3 = modelName.includes('nai-diffusion-3') || modelName.includes('furry') || modelName.includes('safe-diffusion');

            // 计算 variety_boost 的 skip_cfg_above_sigma
            let skipCfgAboveSigma = null;
            if (p.variety_boost) {
                const magicConstant = isV5 ? 58 : (isV45 ? 58 : 19);
                const pixelCount = width * height;
                const ratio = pixelCount / 1011712;
                skipCfgAboveSigma = Math.pow(ratio, 0.5) * magicConstant;
            }

            // 构建请求体 (根据模型版本自适应隔离参数)
            const parameters = {
                params_version: isV3 ? 1 : 3,
                width,
                height,
                scale: params.cfg || p.cfg || (isV3 ? 7 : 6),
                seed,
                sampler: params.sampler || p.sampler || 'k_euler_ancestral',
                noise_schedule: p.scheduler || 'karras',
                steps: params.steps || p.steps || 28,
                n_samples: 1,
                ucPreset: p.ucPreset || 0,
                qualityToggle: p.qualityToggle !== undefined ? p.qualityToggle : true,
                autoSmea: isV3 ? (p.autoSmea !== undefined ? p.autoSmea : false) : false,
                cfg_rescale: p.cfg_rescale || 0,
                dynamic_thresholding: p.decrisper !== undefined ? p.decrisper : false,
                controlnet_strength: 1,
                legacy: false,
                add_original_image: true,
                legacy_v3_extend: false,
                use_coords: useCoords,
                legacy_uc: false,
                normalize_reference_strength_multiple: true,
                inpaintImg2ImgStrength: 1,
                deliberate_euler_ancestral_bug: false,
                prefer_brownian: true,
                image_format: 'png',
                skip_cfg_above_sigma: skipCfgAboveSigma,
                sm: isV3 ? (p.sm !== undefined ? p.sm : false) : false,
                sm_dyn: isV3 ? (p.sm_dyn !== undefined ? p.sm_dyn : false) : false,
                characterPrompts: [],
                negative_prompt: String(finalNegative || '')
            };

            // V4/V5 专有分层与透明背景参数
            if (!isV3) {
                parameters.tag_hint_transparent_background = isV5 && p.transparent !== undefined ? p.transparent : false;
                parameters.transparent = isV5 && p.transparent !== undefined ? p.transparent : false;
                parameters.v4_prompt = {
                    caption: {
                        base_caption: String(baseCaption || ''),
                        char_captions: charCaptions
                    },
                    use_coords: useCoords,
                    use_order: true
                };
                parameters.v4_negative_prompt = {
                    caption: {
                        base_caption: String(finalNegative || ''),
                        char_captions: []
                    },
                    legacy_uc: false
                };
            }

            const requestBody = {
                action: 'generate',
                input: String(baseCaption || ''),
                model: modelName,
                parameters: parameters
            };

            const endpointUrl = this.getGenerateImageUrl(c);
            console.log('[NovelAI] 请求端点:', endpointUrl);
            console.log('[NovelAI] 请求体:', requestBody);

            const response = await this._naiFetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${c.apiToken}`
                },
                body: JSON.stringify(requestBody),
                responseType: 'arraybuffer'
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[NovelAI] 生成失败:', response.status, errText);
                if (response.status === 402) {
                    return { success: false, error: 'Anlas / 配额不足，请检查账户或中转站额度' };
                }
                return { success: false, error: `API 错误 (${response.status}): ${errText}` };
            }

            // 多格式自适应图像解析 (PNG/JPG/WebP 原生流 > ZIP 原生解压 > JSON 格式兼容)
            const buffer = await response.arrayBuffer();
            let base64 = null;
            let format = 'png';

            if (buffer && buffer.byteLength > 8) {
                const u8 = new Uint8Array(buffer);
                const isPng = u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47;
                const isJpg = u8[0] === 0xFF && u8[1] === 0xD8 && u8[2] === 0xFF;
                const isWebp = u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46;

                // 1. 优先检测原生图片流 (PNG / JPG / WebP) - 0延时秒级返回
                if (isPng || isJpg || isWebp) {
                    format = isPng ? 'png' : (isJpg ? 'jpeg' : 'webp');
                    base64 = this._arrayBufferToBase64(buffer);
                    console.log(`[NovelAI v2.2.0] 收到原生 ${format.toUpperCase()} 图像二进制流 (${(buffer.byteLength / 1024).toFixed(1)} KB)，无需解压直接提取成功`);
                } 
                // 2. 仅当开头为标准 ZIP 文件头 (PK\x03\x04) 时，才进入 ZIP 解析流程
                else if (u8[0] === 0x50 && u8[1] === 0x4B && u8[2] === 0x03 && u8[3] === 0x04) {
                    console.log(`[NovelAI v2.2.0] 收到 ZIP 压缩包 (${(buffer.byteLength / 1024).toFixed(1)} KB)，开始原生解压...`);
                    base64 = await this._extractImageFromZip(buffer);
                    format = 'png';
                } 
                // 3. 兼容 JSON 返回 (base64 / b64_json) 的反代站
                else {
                    try {
                        const text = new TextDecoder('utf-8').decode(buffer);
                        const json = JSON.parse(text);
                        const candidate = json.image || json.base64 || json.data?.[0]?.b64_json || json.images?.[0];
                        if (candidate && typeof candidate === 'string') {
                            base64 = candidate.replace(/^data:image\/\w+;base64,/, '');
                            format = 'png';
                            console.log('[NovelAI v2.2.0] 成功从 JSON 数据中提取 Base64 图像');
                        }
                    } catch (e) {}
                }
            }

            if (base64) {
                console.log('[NovelAI v2.2.0] 生成与提取完全成功，交付上层应用！');
                return { success: true, base64, format };
            } else {
                return { success: false, error: '无法从响应数据中提取图片（非有效 PNG/ZIP/JSON 格式）' };
            }
        } catch (e) {
            console.error('[NovelAI v2.2.0] 异常:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * 将 ArrayBuffer 安全转换为 Base64 字符串（分块处理避免栈溢出）
     */
    _arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        const CHUNK_SIZE = 0x8000;
        const parts = [];
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
            parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK_SIZE)));
        }
        return btoa(parts.join(''));
    },

    /**
     * 从 ZIP 中提取 PNG 图片 (优先采用原生 DecompressionStream 零外部依赖解压，秒级完成且不惧网络/CSP阻断)
     */
    async _extractImageFromZip(zipData) {
        if (!zipData || zipData.byteLength < 30) return null;
        const u8 = new Uint8Array(zipData);

        // 非 ZIP 格式立即退出，杜绝无意义的 CDN 加载
        if (u8[0] !== 0x50 || u8[1] !== 0x4B) {
            return null;
        }

        // 验证标准 ZIP Local File Header (PK\x03\x04)
        if (u8[0] === 0x50 && u8[1] === 0x4B && u8[2] === 0x03 && u8[3] === 0x04) {
            const compression = u8[8] | (u8[9] << 8);
            const compSize = (u8[18]) | (u8[19] << 8) | (u8[20] << 16) | (u8[21] << 24);
            const nameLen = u8[26] | (u8[27] << 8);
            const extraLen = u8[28] | (u8[29] << 8);
            const dataOffset = 30 + nameLen + extraLen;

            // 1. 无压缩模式 (Stored)
            if (compression === 0 && dataOffset < u8.length) {
                const end = compSize > 0 ? dataOffset + compSize : u8.length;
                const rawSlice = u8.subarray(dataOffset, end);
                console.log('[NovelAI] ZIP 原生解析成功 (Stored 无压缩)');
                return this._arrayBufferToBase64(rawSlice.buffer.slice(rawSlice.byteOffset, rawSlice.byteOffset + rawSlice.byteLength));
            }

            // 2. 现代浏览器原生零依赖 Deflate 解压 (Chrome 80+, Edge, Safari 16.4+, Firefox 113+)
            if (compression === 8 && typeof DecompressionStream === 'function' && dataOffset < u8.length) {
                try {
                    const end = compSize > 0 ? dataOffset + compSize : u8.length;
                    const compressedSlice = u8.subarray(dataOffset, end);
                    const ds = new DecompressionStream('deflate-raw');
                    const writer = ds.writable.getWriter();
                    writer.write(compressedSlice);
                    writer.close();

                    const reader = ds.readable.getReader();
                    const chunks = [];
                    let totalLen = 0;
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                        totalLen += value.length;
                    }
                    const decompressed = new Uint8Array(totalLen);
                    let offset = 0;
                    for (const chunk of chunks) {
                        decompressed.set(chunk, offset);
                        offset += chunk.length;
                    }
                    console.log('[NovelAI] ZIP 原生零依赖解压成功 (DecompressionStream)');
                    return this._arrayBufferToBase64(decompressed.buffer);
                } catch (nativeErr) {
                    console.warn('[NovelAI] 原生 DecompressionStream 解压缩异常，尝试备用 CDN/JSZip 解析:', nativeErr);
                }
            }
        }

        // 3. 备用方案：多镜像 CDN 动态加载 JSZip (国内高速镜像 + 严格超时防卡死)
        try {
            if (!window.JSZip) {
                const cdns = [
                    'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jszip/3.10.1/jszip.min.js', // 字节跳动高速国内 CDN
                    'https://cdn.bootcdn.net/ajax/libs/jszip/3.10.1/jszip.min.js',                 // BootCDN 国内镜像
                    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',            // Cloudflare CDN
                    'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'                  // jsdelivr
                ];
                for (const src of cdns) {
                    try {
                        await new Promise((resolve, reject) => {
                            const timer = setTimeout(() => reject(new Error('CDN 超时')), 3000);
                            const script = document.createElement('script');
                            script.src = src;
                            script.onload = () => { clearTimeout(timer); resolve(); };
                            script.onerror = () => { clearTimeout(timer); reject(new Error('加载失败')); };
                            document.head.appendChild(script);
                        });
                        if (window.JSZip) {
                            console.log(`[NovelAI] JSZip 加载成功: ${src}`);
                            break;
                        }
                    } catch (err) {
                        console.warn(`[NovelAI] CDN 节点跳过 (${err.message}): ${src}`);
                    }
                }
            }

            if (window.JSZip) {
                const zip = await window.JSZip.loadAsync(zipData);
                const file = Object.values(zip.files).find(f => f.name.endsWith('.png') || f.name.endsWith('.webp'));
                if (file) return await file.async('base64');
            }
        } catch (e) {
            console.error('[NovelAI] ZIP JSZip 解析失败:', e);
        }

        return null;
    },

    // ============ 配置与预设相关 ============

    getDefaultConfig() {
        return {
            activeEndpointPreset: 'official', // 'official' (官方直连) | 'relay' (第三方中转站)
            endpointPresets: {
                official: {
                    name: '官方直连',
                    baseUrl: '',
                    apiToken: '',
                    model: 'nai-diffusion-5-full'
                },
                relay: {
                    name: '第三方中转站',
                    baseUrl: '',
                    apiToken: '',
                    model: 'nai-diffusion-5-full'
                }
            },
            baseUrl: '',
            apiToken: '',
            model: 'nai-diffusion-5-full',
            promptPrefix: '',
            testPrompt: '1girl, masterpiece, best quality',
            autoAdaptModelPreset: true, // 模型画质与采样参数智能自适应 (用户可自主开启/关闭)
            defaultParams: {
                steps: 28,
                cfg: 6,
                width: 832,
                height: 1216,
                sampler: 'k_euler_ancestral',
                scheduler: 'karras',
                seed: -1,
                qualityToggle: true,
                autoSmea: false,
                sm: false,
                sm_dyn: false,
                decrisper: false,
                variety_boost: false,
                v4MultiChar: true,
                transparent: false,
                cfg_rescale: 0,
                ucPreset: 0
            },
            undesiredContent: 'lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'
        };
    },

    normalizeConfig(config = {}) {
        const d = this.getDefaultConfig();
        const c = { ...d, ...config };

        c.endpointPresets = {
            official: { ...d.endpointPresets.official, ...(config.endpointPresets?.official || {}) },
            relay: { ...d.endpointPresets.relay, ...(config.endpointPresets?.relay || {}) }
        };

        // 智能兼容旧版配置：若未保存 endpointPresets，根据现有的 baseUrl 或 apiToken 自动归类
        if (!config.endpointPresets) {
            const hasRelayUrl = c.baseUrl && !c.baseUrl.includes('novelai.net');
            if (hasRelayUrl) {
                c.activeEndpointPreset = 'relay';
                if (c.baseUrl) c.endpointPresets.relay.baseUrl = c.baseUrl;
                if (c.apiToken) c.endpointPresets.relay.apiToken = c.apiToken;
                if (c.model) c.endpointPresets.relay.model = c.model;
            } else {
                c.activeEndpointPreset = 'official';
                c.endpointPresets.official.baseUrl = c.baseUrl || '';
                c.endpointPresets.official.apiToken = c.apiToken || '';
                if (c.model) c.endpointPresets.official.model = c.model;
            }
        }

        if (!['official', 'relay'].includes(c.activeEndpointPreset)) {
            c.activeEndpointPreset = 'official';
        }

        // 确保顶层 baseUrl, apiToken, model 与当前激活预设强一致
        const active = c.endpointPresets[c.activeEndpointPreset] || c.endpointPresets.official;
        c.baseUrl = active.baseUrl !== undefined ? active.baseUrl : c.baseUrl;
        c.apiToken = active.apiToken !== undefined ? active.apiToken : c.apiToken;
        c.model = active.model || c.model;

        return c;
    },

    getConfigFields() {
        return [
            { key: 'baseUrl', label: 'API 地址 (中转站)', type: 'text', placeholder: '留空默认官方 (https://image.novelai.net)' },
            { key: 'apiToken', label: 'API Token / Key', type: 'password' },
            { key: 'model', label: '模型', type: 'select', options: this.MODELS }
        ];
    },

    renderConfigUI(config) {
        const c = this.normalizeConfig(config);
        const p = c.defaultParams || {};
        const activePreset = c.activeEndpointPreset || 'official';
        const presetOfficial = c.endpointPresets.official || {};
        const presetRelay = c.endpointPresets.relay || {};

        const modelOptions = this.MODELS.map(m =>
            `<option value="${m.id}" ${c.model === m.id ? 'selected' : ''}>${m.name}</option>`
        ).join('');

        const samplerOptions = this.SAMPLERS.map(s =>
            `<option value="${s.id}" ${p.sampler === s.id ? 'selected' : ''}>${s.name}</option>`
        ).join('');

        const schedulerOptions = this.SCHEDULERS.map(s =>
            `<option value="${s.id}" ${p.scheduler === s.id ? 'selected' : ''}>${s.name}</option>`
        ).join('');

        const groupedRes = {};
        this.RESOLUTIONS.forEach(r => {
            const grp = r.group || '通用分辨率';
            if (!groupedRes[grp]) groupedRes[grp] = [];
            groupedRes[grp].push(r);
        });

        const resolutionOptions = Object.entries(groupedRes).map(([grpName, list]) => {
            const opts = list.map(r =>
                `<option value="${r.w}x${r.h}" ${p.width === r.w && p.height === r.h ? 'selected' : ''}>${r.label}</option>`
            ).join('');
            return `<optgroup label="${grpName}">${opts}</optgroup>`;
        }).join('');

        return `
            <div class="sd-connector-config" data-connector="novelai">
                <!-- 1. 授权与预设切换卡片 -->
                <div class="sd-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-weight: 600; color: var(--nm-text); font-size: 1.05em;">
                            <i class="fa-solid fa-key" style="color: var(--nm-accent); margin-right: 6px;"></i> 授权与通道预设
                        </h4>
                        <span id="sd-nai-current-badge" class="sd-badge" style="background: ${activePreset === 'official' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(14, 165, 233, 0.15)'}; color: ${activePreset === 'official' ? '#eab308' : '#38bdf8'}; border: 1px solid ${activePreset === 'official' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(14, 165, 233, 0.3)'}; padding: 3px 10px; border-radius: 12px; font-size: 0.78em; font-weight: 600;">
                            ${activePreset === 'official' ? '👑 官方直连' : '⚡ 第三方中转'}
                        </span>
                    </div>

                    <!-- 官方 / 中转站 快捷切换 Tab 按钮组 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 0.84em; color: var(--nm-text-muted); margin-bottom: 6px; font-weight: 500;">
                            <i class="fa-solid fa-bolt" style="color: var(--nm-accent); margin-right: 4px;"></i> 快速切换通道预设 (官方 / 中转站)
                        </label>
                        <div class="sd-nai-preset-tab-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: rgba(0,0,0,0.25); padding: 4px; border-radius: 8px; border: 1px solid var(--nm-border);">
                            <button type="button" class="sd-nai-preset-btn ${activePreset === 'official' ? 'active' : ''}" data-preset="official"
                                    style="padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.88em; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; ${activePreset === 'official' ? 'background: var(--nm-accent); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);' : 'background: transparent; color: var(--nm-text-muted);'}">
                                <i class="fa-solid fa-crown" style="${activePreset === 'official' ? 'color:#ffd700;' : ''}"></i>
                                <span>👑 官方直连 (Official)</span>
                            </button>
                            <button type="button" class="sd-nai-preset-btn ${activePreset === 'relay' ? 'active' : ''}" data-preset="relay"
                                    style="padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.88em; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; ${activePreset === 'relay' ? 'background: var(--nm-accent); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);' : 'background: transparent; color: var(--nm-text-muted);'}">
                                <i class="fa-solid fa-server" style="${activePreset === 'relay' ? 'color:#38bdf8;' : ''}"></i>
                                <span>⚡ 第三方中转站 (Relay)</span>
                            </button>
                        </div>
                    </div>

                    <!-- 动态模式状态 Banner -->
                    <div id="sd-nai-preset-banner" style="display: flex; align-items: center; justify-content: space-between; border-radius: 6px; padding: 7px 12px; margin-bottom: 14px; font-size: 0.82em; background: ${activePreset === 'official' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(14, 165, 233, 0.08)'}; border-left: 3px solid ${activePreset === 'official' ? '#eab308' : '#0ea5e9'}; color: var(--nm-text);">
                        <span id="sd-nai-preset-banner-text" style="display:flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-circle-info" style="color: ${activePreset === 'official' ? '#eab308' : '#0ea5e9'};"></i>
                            <span>${activePreset === 'official' ? '已激活 <strong>NovelAI 官方直连预设</strong>（直连官方云端，使用 pst- 令牌）' : '已激活 <strong>第三方中转站预设</strong>（自定义中转 API 地址与密钥）'}</span>
                        </span>
                        <span id="sd-nai-preset-banner-tag" style="background: ${activePreset === 'official' ? 'rgba(234,179,8,0.2)' : 'rgba(14,165,233,0.2)'}; color: ${activePreset === 'official' ? '#facc15' : '#38bdf8'}; padding: 2px 7px; border-radius: 4px; font-weight:600; font-size: 0.9em;">
                            ${activePreset === 'official' ? '官方通道' : '中转站'}
                        </span>
                    </div>

                    <!-- 隐藏状态缓存，用于多预设数据无损隔离与快速切换 -->
                    <input type="hidden" id="sd-nai-active-preset" value="${activePreset}">
                    <input type="hidden" id="sd-nai-cache-official-url" value="${presetOfficial.baseUrl || ''}">
                    <input type="hidden" id="sd-nai-cache-official-token" value="${presetOfficial.apiToken || ''}">
                    <input type="hidden" id="sd-nai-cache-official-model" value="${presetOfficial.model || 'nai-diffusion-5-full'}">
                    <input type="hidden" id="sd-nai-cache-relay-url" value="${presetRelay.baseUrl || ''}">
                    <input type="hidden" id="sd-nai-cache-relay-token" value="${presetRelay.apiToken || ''}">
                    <input type="hidden" id="sd-nai-cache-relay-model" value="${presetRelay.model || 'nai-diffusion-5-full'}">

                    <!-- API 地址 / 中转站 (Base URL) -->
                    <div class="sd-api-row" id="sd-nai-url-row" style="margin-bottom: 6px;">
                        <label id="sd-nai-url-label">${activePreset === 'official' ? '官方端点' : '中转站地址'}</label>
                        <input type="text" id="sd-novelai-url" class="text_pole" 
                               placeholder="${activePreset === 'official' ? '官方直连留空 (默认 https://image.novelai.net)' : '请输入第三方中转站 API 地址 (如 https://api.example.com)'}" 
                               value="${c.baseUrl || ''}">
                    </div>
                    <div id="sd-nai-quick-urls-row" style="display: flex; flex-wrap: wrap; gap: 6px; margin-left: 112px; margin-top: -4px; margin-bottom: 12px; align-items: center;">
                        <button type="button" class="sd-btn-secondary sd-nai-quick-url" data-url="" style="font-size: 0.78em; padding: 2px 8px; border-radius: 4px;"><i class="fa-solid fa-globe" style="margin-right:3px;"></i>恢复官方默认端点 (留空)</button>
                    </div>

                    <div class="sd-api-row">
                        <label id="sd-nai-token-label">${activePreset === 'official' ? '官方 Token' : '中转站 Key'}</label>
                        <div class="sd-password-wrapper">
                            <input type="password" id="sd-novelai-token" class="text_pole" 
                                   placeholder="${activePreset === 'official' ? '官方填 pst-xxxx' : '中转站填对应 API Key'}" 
                                   value="${c.apiToken || ''}">
                            <button type="button" class="sd-password-toggle-btn" data-target="#sd-novelai-token" title="显示/隐藏 API Token">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <small id="sd-nai-token-help" style="color: var(--nm-text-muted); display: block; margin-left: 112px; margin-top: -6px; margin-bottom: 12px; font-size: 0.82em;">
                        ${activePreset === 'official' ? '官方账户持久令牌（可在 NovelAI 设置中获取，以 <code>pst-</code> 开头）' : '第三方中转服务商提供的 API 密钥'}
                    </small>

                    <div class="sd-api-row">
                        <label>模型版本</label>
                        <select id="sd-novelai-model" class="text_pole">${modelOptions}</select>
                    </div>

                    <div class="sd-setting-row" style="margin-top: 12px; border-bottom: none; padding-bottom: 0;">
                        <div class="sd-setting-label">
                            <span style="font-weight:600;">模型智能预设自适应</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">切换 V3 / V4 / V5 模型时，自动为您提示并调整最匹配的采样器、调度器、CFG 及画质预设（由您决定是否开启）</small>
                        </div>
                        <div class="sd-setting-control">
                            <label class="sd-toggle">
                                <input type="checkbox" id="sd-novelai-auto-adapt" ${c.autoAdaptModelPreset !== false ? 'checked' : ''}>
                                <span class="sd-slider"></span>
                            </label>
                        </div>
                    </div>

                    <button id="sd-novelai-test" class="sd-btn-secondary" style="width:100%; margin-top:14px;"><i class="fa-solid fa-flask" style="margin-right:4px;"></i> 测试API连接</button>
                </div>

                <!-- 2. 生图基础参数卡片 (精简两排布局) -->
                <div class="sd-card">
                    <h4 style="margin-top:0; margin-bottom:15px; font-weight:600; color:var(--nm-text);"><i class="fa-solid fa-sliders" style="color:var(--nm-accent); margin-right:4px;"></i> 生图基础参数</h4>

                    <!-- 第 1 排：分辨率、采样算法、调度器 -->
                    <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                        <div>
                            <label style="display: block; font-size: 0.85em; color: var(--nm-text-muted); margin-bottom: 4px; font-weight: 500;">默认分辨率</label>
                            <select id="sd-novelai-resolution" class="text_pole" style="width: 100%; box-sizing: border-box;">${resolutionOptions}</select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85em; color: var(--nm-text-muted); margin-bottom: 4px; font-weight: 500;">采样算法</label>
                            <select id="sd-novelai-sampler" class="text_pole" style="width: 100%; box-sizing: border-box;">${samplerOptions}</select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85em; color: var(--nm-text-muted); margin-bottom: 4px; font-weight: 500;">调度器</label>
                            <select id="sd-novelai-scheduler" class="text_pole" style="width: 100%; box-sizing: border-box;">${schedulerOptions}</select>
                        </div>
                    </div>

                    <!-- 第 2 排：CFG Scale、采样步数、随机种子 -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="display: block; font-size: 0.85em; color: var(--nm-text-muted); margin-bottom: 4px; font-weight: 500;">CFG Scale</label>
                            <input type="number" id="sd-novelai-cfg" class="text_pole" 
                                   value="${p.cfg || 6}" min="1" max="20" step="0.5" style="width: 100%; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85em; color: var(--nm-text-muted); margin-bottom: 4px; font-weight: 500;">采样步数</label>
                            <input type="number" id="sd-novelai-steps" class="text_pole" 
                                   value="${p.steps || 28}" min="1" max="50" style="width: 100%; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85em; color: var(--nm-text-muted); margin-bottom: 4px; font-weight: 500;">随机种子 (-1随机)</label>
                            <input type="number" id="sd-novelai-seed" class="text_pole" 
                                   value="${p.seed !== undefined ? p.seed : -1}" placeholder="-1为随机" style="width: 100%; box-sizing: border-box;">
                        </div>
                    </div>
                </div>

                <!-- 3. 进阶功能与采样开关卡片 (标准 .sd-setting-row) -->
                <div class="sd-card">
                    <h4 style="margin-top:0; margin-bottom:15px; font-weight:600; color:var(--nm-text);"><i class="fa-solid fa-rocket" style="color:var(--nm-accent); margin-right:4px;"></i> 进阶功能与采样优化</h4>

                    <div class="sd-setting-row">
                        <div class="sd-setting-label">
                            <span style="font-weight:600;">Quality+ (画质增强)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">自动追加官方画质提示词，显著提升线条与光影质感（建议开启）</small>
                        </div>
                        <div class="sd-setting-control">
                            <label class="sd-toggle">
                                <input type="checkbox" id="sd-novelai-quality-toggle" ${p.qualityToggle ? 'checked' : ''}>
                                <span class="sd-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="sd-setting-row">
                        <div class="sd-setting-label">
                            <span style="font-weight:600;">透明背景生成 (仅V5)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">直接生成透明背景角色图片，无需额外抠图（NovelAI V5 原生特性）</small>
                        </div>
                        <div class="sd-setting-control">
                            <label class="sd-toggle">
                                <input type="checkbox" id="sd-novelai-transparent" ${p.transparent ? 'checked' : ''}>
                                <span class="sd-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="sd-setting-row">
                        <div class="sd-setting-label">
                            <span style="font-weight:600;">多角色分层与空间构图 (V4/V5)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">允许使用 <code>&lt;char&gt;...&lt;/char&gt;</code> 独立描绘多名角色，支持 <code>pos="left/right"</code> 方位或 <code>x/y</code> 坐标定位与自动均布，彻底防止特征相互污染与重叠</small>
                        </div>
                        <div class="sd-setting-control">
                            <label class="sd-toggle">
                                <input type="checkbox" id="sd-novelai-v4-multi" ${p.v4MultiChar !== false ? 'checked' : ''}>
                                <span class="sd-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="sd-setting-row">
                        <div class="sd-setting-label">
                            <span style="font-weight:600;">Auto SMEA (大图自适应)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">在大图或高分辨率时自动启用 SMEA 算法，防止大图肢体崩坏 (仅V3有效)</small>
                        </div>
                        <div class="sd-setting-control">
                            <label class="sd-toggle">
                                <input type="checkbox" id="sd-novelai-auto-smea" ${p.autoSmea ? 'checked' : ''}>
                                <span class="sd-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="sd-setting-row">
                        <div class="sd-setting-label">
                            <span style="font-weight:600;">Decrisper (过锐化降噪)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">在高 CFG 值下平滑色彩噪点，有效防止画面过饱和与黑斑产生</small>
                        </div>
                        <div class="sd-setting-control">
                            <label class="sd-toggle">
                                <input type="checkbox" id="sd-novelai-decrisper" ${p.decrisper ? 'checked' : ''}>
                                <span class="sd-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="sd-setting-row">
                        <div class="sd-setting-label">
                            <span style="font-weight:600;">Variety+ (构图多样性)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">在采样高 Sigma 阶段跳过 CFG 引导，极大提升角色姿态与构图多样性</small>
                        </div>
                        <div class="sd-setting-control">
                            <label class="sd-toggle">
                                <input type="checkbox" id="sd-novelai-variety-boost" ${p.variety_boost ? 'checked' : ''}>
                                <span class="sd-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="sd-setting-row">
                        <div class="sd-setting-label">
                            <span style="font-weight:600;">SMEA 采样优化 (仅V3)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">Sinusoidal Multipass Euler Ancestral 采样算法（仅适用于 V3 模型）</small>
                        </div>
                        <div class="sd-setting-control">
                            <label class="sd-toggle">
                                <input type="checkbox" id="sd-novelai-sm" ${p.sm ? 'checked' : ''}>
                                <span class="sd-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="sd-setting-row" style="border-bottom:none;">
                        <div class="sd-setting-label">
                            <span style="font-weight:600;">SMEA DYN 动态采样 (仅V3)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">动态调整的 SMEA 采样算法，适合高分辨率构图（仅适用于 V3 模型）</small>
                        </div>
                        <div class="sd-setting-control">
                            <label class="sd-toggle">
                                <input type="checkbox" id="sd-novelai-sm-dyn" ${p.sm_dyn ? 'checked' : ''}>
                                <span class="sd-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- 4. 测试生图卡片 -->
                <div class="sd-card">
                    <h4 style="margin-top:0; margin-bottom:15px; font-weight:600; color:var(--nm-text);"><i class="fa-solid fa-image" style="color:var(--nm-accent); margin-right:4px;"></i> 测试生图</h4>
                    
                    <div style="display:flex; gap:8px; margin-bottom:12px;">
                        <input type="text" id="sd-novelai-test-prompt" class="text_pole" 
                                placeholder="输入测试提示词，如: 1girl, masterpiece, best quality" 
                                style="flex:1;" value="${c.testPrompt || '1girl, masterpiece, best quality'}">
                        <button id="sd-novelai-test-gen" class="sd-btn-primary" style="white-space:nowrap; padding:8px 16px;"><i class="fa-solid fa-wand-magic-sparkles" style="margin-right:4px;"></i> 生成测试</button>
                    </div>

                    <div id="sd-novelai-test-result" style="text-align:center; min-height:100px; background:rgba(0,0,0,0.2); border-radius:var(--nm-radius-sm); padding:16px; display:flex; align-items:center; justify-content:center; border:1px dashed var(--nm-border);">
                        <span style="color:var(--nm-text-muted); font-size:0.9em;">点击上方“生成测试”按钮测试连接与效果</span>
                    </div>
                </div>

                <!-- 5. 资费提示卡片 -->
                <div class="sd-card" style="border-left: 3px solid var(--nm-accent); background: rgba(96, 205, 255, 0.05); padding: 12px 16px; margin-bottom: 0;">
                    <div style="display:flex; align-items:center; gap:8px; color:var(--nm-accent); font-size:0.88em; font-weight:500;">
                        <span style="color:var(--nm-accent); font-size:1.1em;"><i class="fa-solid fa-lightbulb"></i></span>
                        <span>官方直连需消耗账户 Anlas；使用第三方中转站按对应服务商计费规则结算。</span>
                    </div>
                </div>
            </div>`;
    },

    parseConfigFromUI(existingConfig = {}) {
        const resolution = $('#sd-novelai-resolution').val()?.split('x') || ['832', '1216'];
        const activePreset = $('#sd-nai-active-preset').val() || 'official';

        // 收集各预设缓存
        const officialUrl = ($('#sd-nai-cache-official-url').val() || '').trim();
        const officialToken = ($('#sd-nai-cache-official-token').val() || '').trim();
        const officialModel = $('#sd-nai-cache-official-model').val() || 'nai-diffusion-5-full';

        const relayUrl = ($('#sd-nai-cache-relay-url').val() || '').trim();
        const relayToken = ($('#sd-nai-cache-relay-token').val() || '').trim();
        const relayModel = $('#sd-nai-cache-relay-model').val() || 'nai-diffusion-5-full';

        // 当前可见输入框中的最新值覆盖当前激活预设
        const currentUrl = ($('#sd-novelai-url').val() || '').trim();
        const currentToken = ($('#sd-novelai-token').val() || '').trim();
        const currentModel = $('#sd-novelai-model').val() || (activePreset === 'official' ? officialModel : relayModel);

        const endpointPresets = {
            official: {
                name: '官方直连',
                baseUrl: activePreset === 'official' ? currentUrl : officialUrl,
                apiToken: activePreset === 'official' ? currentToken : officialToken,
                model: activePreset === 'official' ? currentModel : officialModel
            },
            relay: {
                name: '第三方中转站',
                baseUrl: activePreset === 'relay' ? currentUrl : relayUrl,
                apiToken: activePreset === 'relay' ? currentToken : relayToken,
                model: activePreset === 'relay' ? currentModel : relayModel
            }
        };

        return {
            activeEndpointPreset: activePreset,
            endpointPresets: endpointPresets,
            baseUrl: currentUrl,
            apiToken: currentToken,
            model: currentModel,
            testPrompt: ($('#sd-novelai-test-prompt').val() || '1girl, masterpiece, best quality').trim(),
            autoAdaptModelPreset: $('#sd-novelai-auto-adapt').is(':checked'),
            defaultParams: {
                steps: parseInt($('#sd-novelai-steps').val()) || 28,
                cfg: parseFloat($('#sd-novelai-cfg').val()) || 6,
                seed: (parseInt($('#sd-novelai-seed').val()) !== undefined && !isNaN(parseInt($('#sd-novelai-seed').val()))) ? parseInt($('#sd-novelai-seed').val()) : -1,
                width: parseInt(resolution[0]) || 832,
                height: parseInt(resolution[1]) || 1216,
                sampler: $('#sd-novelai-sampler').val() || 'k_euler_ancestral',
                scheduler: $('#sd-novelai-scheduler').val() || 'karras',
                qualityToggle: $('#sd-novelai-quality-toggle').is(':checked'),
                autoSmea: $('#sd-novelai-auto-smea').is(':checked'),
                sm: $('#sd-novelai-sm').is(':checked'),
                sm_dyn: $('#sd-novelai-sm-dyn').is(':checked'),
                decrisper: $('#sd-novelai-decrisper').is(':checked'),
                variety_boost: $('#sd-novelai-variety-boost').is(':checked'),
                v4MultiChar: $('#sd-novelai-v4-multi').is(':checked'),
                transparent: $('#sd-novelai-transparent').is(':checked'),
                cfg_rescale: 0,
                ucPreset: 0
            },
            undesiredContent: existingConfig.undesiredContent || ''
        };
    },

    bindEvents(context = {}) {
        const toastr = context.toastr || window.toastr;

        function updatePresetUI(targetPreset) {
            const isOfficial = targetPreset === 'official';

            // 1. Tab 按钮高亮与样式切换
            $('.sd-nai-preset-btn').each(function () {
                const isTarget = $(this).attr('data-preset') === targetPreset;
                $(this).toggleClass('active', isTarget);
                if (isTarget) {
                    $(this).css({
                        background: 'var(--nm-accent)',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                    });
                } else {
                    $(this).css({
                        background: 'transparent',
                        color: 'var(--nm-text-muted)',
                        boxShadow: 'none'
                    });
                }
            });

            // 2. 状态徽章与 Banner 更新
            $('#sd-nai-current-badge').css({
                background: isOfficial ? 'rgba(234, 179, 8, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                color: isOfficial ? '#eab308' : '#38bdf8',
                border: isOfficial ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(14, 165, 233, 0.3)'
            }).text(isOfficial ? '👑 官方直连' : '⚡ 第三方中转');

            $('#sd-nai-preset-banner').css({
                background: isOfficial ? 'rgba(234, 179, 8, 0.08)' : 'rgba(14, 165, 233, 0.08)',
                borderLeft: isOfficial ? '3px solid #eab308' : '3px solid #0ea5e9'
            });

            $('#sd-nai-preset-banner-text').html(`
                <i class="fa-solid fa-circle-info" style="color: ${isOfficial ? '#eab308' : '#0ea5e9'};"></i>
                <span>${isOfficial ? '已激活 <strong>NovelAI 官方直连预设</strong>（直连官方云端，使用 pst- 令牌）' : '已激活 <strong>第三方中转站预设</strong>（自定义中转 API 地址与密钥）'}</span>
            `);

            $('#sd-nai-preset-banner-tag').css({
                background: isOfficial ? 'rgba(234,179,8,0.2)' : 'rgba(14,165,233,0.2)',
                color: isOfficial ? '#facc15' : '#38bdf8'
            }).text(isOfficial ? '官方通道' : '中转站');

            // 3. 输入框提示与标签自适应更新
            $('#sd-nai-url-label').text(isOfficial ? '官方端点' : '中转站地址');
            $('#sd-novelai-url').attr('placeholder', isOfficial ? '官方直连留空 (默认 https://image.novelai.net)' : '请输入第三方中转站 API 地址 (如 https://api.example.com)');
            $('#sd-nai-token-label').text(isOfficial ? '官方 Token' : '中转站 Key');
            $('#sd-novelai-token').attr('placeholder', isOfficial ? '官方填 pst-xxxx' : '中转站填对应 API Key');
            $('#sd-nai-token-help').html(isOfficial ? '官方账户持久令牌（以 <code>pst-</code> 开头）' : '第三方中转服务商提供的 API 密钥');
        }

        // 预设切换按钮事件
        $('.sd-nai-preset-btn').off('click.nai-preset').on('click.nai-preset', function () {
            const targetPreset = $(this).attr('data-preset');
            const currentPreset = $('#sd-nai-active-preset').val() || 'official';
            if (targetPreset === currentPreset) return;

            // 1. 保存当前输入框的值至前一个预设缓存
            $(`#sd-nai-cache-${currentPreset}-url`).val($('#sd-novelai-url').val() || '');
            $(`#sd-nai-cache-${currentPreset}-token`).val($('#sd-novelai-token').val() || '');
            $(`#sd-nai-cache-${currentPreset}-model`).val($('#sd-novelai-model').val() || '');

            // 2. 标记当前预设
            $('#sd-nai-active-preset').val(targetPreset);

            // 3. 取出目标预设缓存并填入界面
            const targetUrl = $(`#sd-nai-cache-${targetPreset}-url`).val() || '';
            const targetToken = $(`#sd-nai-cache-${targetPreset}-token`).val() || '';
            let targetModel = $(`#sd-nai-cache-${targetPreset}-model`).val();
            if (!targetModel) {
                targetModel = 'nai-diffusion-5-full';
            }

            $('#sd-novelai-url').val(targetUrl).trigger('input');
            $('#sd-novelai-token').val(targetToken).trigger('input');
            $('#sd-novelai-model').val(targetModel).trigger('change');

            // 4. 更新样式与提示
            updatePresetUI(targetPreset);

            // 5. 自动触发酒馆配置保存
            if ($('#sd-save-model-config').length) {
                $('#sd-save-model-config').trigger('click');
            }
            if (typeof toastr !== 'undefined' && toastr.success) {
                toastr.success(targetPreset === 'official' ? '已快速切换至 [👑 官方直连] 预设' : '已快速切换至 [⚡ 第三方中转站] 预设', 'NovelAI');
            }
        });

        // 实时同步输入值到当前活跃预设缓存
        $('#sd-novelai-url').off('input.nai-sync').on('input.nai-sync', function () {
            const active = $('#sd-nai-active-preset').val() || 'official';
            $(`#sd-nai-cache-${active}-url`).val($(this).val() || '');
        });
        $('#sd-novelai-token').off('input.nai-sync').on('input.nai-sync', function () {
            const active = $('#sd-nai-active-preset').val() || 'official';
            $(`#sd-nai-cache-${active}-token`).val($(this).val() || '');
        });
        $('#sd-novelai-model').off('change.nai-sync').on('change.nai-sync', function () {
            const active = $('#sd-nai-active-preset').val() || 'official';
            $(`#sd-nai-cache-${active}-model`).val($(this).val() || '');
        });

        // 快捷填入中转站/官方地址
        $('.sd-nai-quick-url').off('click.nai-url').on('click.nai-url', function () {
            const url = $(this).attr('data-url') || '';
            if (!url) {
                $('#sd-novelai-url').val('').trigger('input');
            } else {
                if ($('#sd-nai-active-preset').val() === 'official') {
                    $('.sd-nai-preset-btn[data-preset="relay"]').trigger('click');
                }
                $('#sd-novelai-url').val(url).trigger('input');
            }
            if (typeof toastr !== 'undefined' && toastr.info) {
                toastr.info(url ? `已填入地址: ${url}` : '已恢复为官方默认直连端点', 'NovelAI');
            }
        });

        // 模型切换自适应推荐
        $('#sd-novelai-model').off('change.nai').on('change.nai', function () {
            const newModel = $(this).val() || '';
            const isAutoAdapt = $('#sd-novelai-auto-adapt').is(':checked');
            if (!isAutoAdapt) return;

            const isV5 = newModel.includes('nai-diffusion-5');
            const isV4 = newModel.includes('nai-diffusion-4');
            const isV3 = newModel.includes('nai-diffusion-3') || newModel.includes('furry') || newModel.includes('safe-diffusion');

            if (isV5 || isV4) {
                $('#sd-novelai-sampler').val('k_euler_ancestral');
                $('#sd-novelai-scheduler').val('karras');
                $('#sd-novelai-cfg').val('6');
                $('#sd-novelai-quality-toggle').prop('checked', true);
                $('#sd-novelai-v4-multi').prop('checked', true);
                $('#sd-novelai-sm').prop('checked', false);
                $('#sd-novelai-sm-dyn').prop('checked', false);
                const toastMsg = `已自适应切换至 [${isV5 ? 'NAI V5' : 'NAI V4'}] 推荐采样与画质预设 (Euler a / Karras / CFG 6.0)`;
                if (typeof toastr !== 'undefined' && toastr.info) toastr.info(toastMsg, 'NovelAI');
            } else if (isV3) {
                $('#sd-novelai-sampler').val('k_euler_ancestral');
                $('#sd-novelai-scheduler').val('karras');
                $('#sd-novelai-cfg').val('7');
                $('#sd-novelai-v4-multi').prop('checked', false);
                $('#sd-novelai-transparent').prop('checked', false);
                const toastMsg = '已自适应切换至 [NAI V3] 推荐采样预设 (CFG 7.0 / 停用V4多角色分层)';
                if (typeof toastr !== 'undefined' && toastr.info) toastr.info(toastMsg, 'NovelAI');
            }
        });

        // 测试连接按钮
        $('#sd-novelai-test').off('click.nai').on('click.nai', async function () {
            const btn = $(this);
            btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin" style="margin-right:4px;"></i> 测试中...');
            try {
                const config = NovelAIConnector.parseConfigFromUI();
                const result = await NovelAIConnector.testConnection(config);
                if (result.success) {
                    if (toastr) toastr.success(result.message, 'NovelAI');
                    else alert(result.message);
                } else {
                    if (toastr) toastr.error(result.message, 'NovelAI');
                    else alert(result.message);
                }
            } catch (e) {
                if (toastr) toastr.error(`测试异常: ${e.message}`, 'NovelAI');
            } finally {
                btn.prop('disabled', false).html('<i class="fa-solid fa-flask" style="margin-right:4px;"></i> 测试API连接');
            }
        });

        // 测试生图按钮
        $('#sd-novelai-test-gen').off('click.nai').on('click.nai', async function () {
            const btn = $(this);
            const $result = $('#sd-novelai-test-result');
            const testPrompt = ($('#sd-novelai-test-prompt').val() || '1girl, masterpiece, best quality').trim();

            btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin" style="margin-right:4px;"></i> 生成中...');
            $result.html(`
                <div class="sd-skeleton-img" style="min-height:120px; display:flex; align-items:center; justify-content:center; color:var(--nm-accent); font-size:0.9em; gap:8px;">
                    <span style="font-size: 1.2em;"><i class="fa-solid fa-spinner fa-spin"></i></span>
                    <span>正在连接 NovelAI 生成测试图片...</span>
                </div>
            `);

            try {
                const config = NovelAIConnector.parseConfigFromUI();
                if (!config.apiToken) {
                    throw new Error('请先填写 API Token');
                }

                const settings = window.SD_SETTINGS || context.settings || {};
                const presetName = settings.activePreset;
                const preset = settings.promptPresets?.[presetName] || {};
                const finalPrompt = `${preset.prefix ? preset.prefix + ', ' : ''}${testPrompt}${preset.suffix ? ', ' + preset.suffix : ''}`.replace(/,\s*,/g, ',').trim();
                const finalNegative = preset.negative || config.undesiredContent || '';

                const genResult = await NovelAIConnector.generate(finalPrompt, finalNegative, {}, config);
                if (genResult.success && genResult.base64) {
                    $result.html(`
                        <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                            <img src="data:image/${genResult.format || 'png'};base64,${genResult.base64}" style="max-width:100%; max-height:300px; border-radius:var(--nm-radius-sm); box-shadow: 0 4px 16px var(--nm-shadow-dark);" alt="Test Result" />
                            <small style="color:var(--nm-text-muted); font-size:0.8em;"><i class="fa-solid fa-circle-check" style="color:#22c55e; margin-right:3px;"></i> 生成成功 (${config.model || 'NovelAI'})</small>
                        </div>
                    `);
                    if (toastr) toastr.success('测试图片生成成功！', 'NovelAI');
                } else {
                    $result.html(`
                        <div style="color: #ff6b6b; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <span style="font-size: 1.3em; color:#ff6b6b;"><i class="fa-solid fa-circle-xmark"></i></span>
                            <span style="font-size: 0.9em; font-weight: 500;">生成失败: ${genResult.error || '未知错误'}</span>
                        </div>
                    `);
                    if (toastr) toastr.error(genResult.error || '生成失败', 'NovelAI');
                }
            } catch (e) {
                $result.html(`
                    <div style="color: #ff6b6b; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <span style="font-size: 1.3em; color:#ff6b6b;"><i class="fa-solid fa-circle-xmark"></i></span>
                        <span style="font-size: 0.9em; font-weight: 500;">请求失败: ${e.message}</span>
                    </div>
                `);
                if (toastr) toastr.error(e.message, 'NovelAI');
            } finally {
                btn.prop('disabled', false).html('<i class="fa-solid fa-wand-magic-sparkles" style="margin-right:4px;"></i> 生成测试');
            }
        });
    },

    validateConfig(config) {
        if (!config.apiToken) {
            return { valid: false, errors: ['请配置 API Token 或中转站 Key'] };
        }
        return { valid: true, errors: [] };
    }
};

// 注册连接器
if (typeof window !== 'undefined') {
    window.SD_CONNECTORS = window.SD_CONNECTORS || [];
    const existingIdx = window.SD_CONNECTORS.findIndex(c => c && (c.id === 'novelai' || c.name === 'NovelAI'));
    if (existingIdx >= 0) {
        window.SD_CONNECTORS[existingIdx] = NovelAIConnector;
    } else {
        window.SD_CONNECTORS.push(NovelAIConnector);
    }
    window.SD_NovelAIConnector = NovelAIConnector;
    if (window.SD_ConnectorManager && typeof window.SD_ConnectorManager.register === 'function') {
        window.SD_ConnectorManager.register(NovelAIConnector);
    }
    console.log('[生图助手] NovelAI 连接器已成功注册/更新！');
}
