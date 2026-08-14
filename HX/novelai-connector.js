/**
 * SD Helper - NovelAI 连接器
 * 直接调用 NovelAI API（直连模式）
 * 
 * v4.5 - 酒馆助手原生规范对齐版：
 * 1. 严格参考「酒馆助手脚本」的官方 UI 规范与样式结构
 * 2. 全面采用原生 .sd-card、.sd-api-row、.sd-setting-row 与 .text_pole
 * 3. 进阶设置对齐酒馆助手的开关行结构（左侧标题+说明，右侧 .sd-toggle 切换开关）
 * 4. 彻底消除布局错乱与 CSS 冲突，完美适配桌面与移动端
 * 5. 全量使用酒馆助手原生 CSS 变量 (--nm-accent, --nm-border 等)
 */

const NovelAIConnector = {
    id: 'novelai',
    name: 'NovelAI',
    description: '连接 NovelAI 图像生成服务（直连模式）',
    icon: '🎨',

    // 可用模型
    MODELS: [
        { id: 'nai-diffusion-4-5-full', name: 'NAI Diffusion V4.5 Full (最新)' },
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
        { id: 'k_dpmpp_sde', name: 'DPM++ SDE' },
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
        { w: 512, h: 512, label: '512x512 (1:1, 小图)' },
        { w: 640, h: 640, label: '640x640 (1:1)' },
        { w: 512, h: 768, label: '512x768 (2:3, 竖版)' },
        { w: 768, h: 512, label: '768x512 (3:2, 横版)' },
        { w: 576, h: 960, label: '576x960 (9:16, 竖版壁纸)' },
        { w: 960, h: 576, label: '960x576 (16:9, 横版壁纸)' },
        { w: 704, h: 1280, label: '704x1280 (9:16, 720p)' },
        { w: 1280, h: 704, label: '1280x704 (16:9, 720p)' },
        { w: 1088, h: 1920, label: '1088x1920 (9:16, 1080p)' },
        { w: 1920, h: 1088, label: '1920x1088 (16:9, 1080p)' },
        { w: 1024, h: 1024, label: '1024x1024 (1:1, SDXL)' },
        { w: 896, h: 1152, label: '896x1152 (7:9, SDXL)' },
        { w: 1152, h: 896, label: '1152x896 (9:7, SDXL)' },
        { w: 832, h: 1216, label: '832x1216 (13:19, SDXL 竖版推荐)' },
        { w: 1216, h: 832, label: '1216x832 (19:13, SDXL 横版推荐)' },
        { w: 768, h: 1344, label: '768x1344 (3:4, SDXL)' },
        { w: 1344, h: 768, label: '1344x768 (4:3, SDXL)' },
        { w: 640, h: 1536, label: '640x1536 (10:24, SDXL)' },
        { w: 1536, h: 640, label: '1536x640 (24:10, SDXL)' },
        { w: 1024, h: 1536, label: '1024x1536 (2:3)' },
        { w: 1536, h: 1024, label: '1536x1024 (3:2)' },
        { w: 1024, h: 1792, label: '1024x1792 (4:7)' },
        { w: 1792, h: 1024, label: '1792x1024 (7:4)' }
    ],

    // ============ 核心方法 ============

    async testConnection(config) {
        console.log('[NovelAI] 测试连接...');

        if (!config.apiToken) {
            return { success: false, message: '请配置 API Token' };
        }

        // 验证 Token 格式
        if (!config.apiToken.startsWith('pst-')) {
            return { success: false, message: 'Token 格式错误，应以 pst- 开头' };
        }

        // 真正调用 NovelAI API 验证 Token
        try {
            const response = await fetch('https://image.novelai.net/ai/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiToken}`
                },
                body: JSON.stringify({ input: '', model: 'test', parameters: {} }) // 最小请求体
            });

            // 401/403 = Token 无效
            if (response.status === 401 || response.status === 403) {
                return { success: false, message: 'Token 无效或已过期，请检查' };
            }

            // 400 = 请求参数错误，但 Token 有效（预期）
            // 200 = 不太可能，但也算成功
            if (response.status === 400 || response.ok) {
                return { success: true, message: '✅ 连接成功，Token 有效！' };
            }

            // 其他错误
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

            // 多角色分层解析 (V4/V4.5 Multi-Character Prompting)
            let baseCaption = finalPrompt;
            const charCaptions = [];
            
            if (p.v4MultiChar !== false) {
                const charRegex = /<char>(.*?)<\/char>/gi;
                let match;
                
                while ((match = charRegex.exec(finalPrompt)) !== null) {
                    if (match[1] && match[1].trim()) {
                        charCaptions.push({
                            char_caption: match[1].trim(),
                            centers: [{ x: 0.5, y: 0.5 }]
                        });
                    }
                }
                
                // 从基础提示词中移除 <char> 标签及其内容
                baseCaption = baseCaption.replace(/<char>.*?<\/char>/gi, '').replace(/,\s*,/g, ',').trim();
                // 去除可能遗留的开头或结尾的逗号
                baseCaption = baseCaption.replace(/^,|,$/g, '').trim();
            }

            const finalNegative = negative || c.undesiredContent || '';

            const width = params.width || p.width || 832;
            const height = params.height || p.height || 1216;

            // seed 处理：-1 或未定义时随机生成
            const inputSeed = params.seed !== undefined ? params.seed : (p.seed !== undefined ? p.seed : -1);
            const seed = (inputSeed >= 0) ? inputSeed : Math.floor(Math.random() * 4294967295);

            const modelName = c.model || 'nai-diffusion-4-5-full';
            const isV45 = modelName.includes('nai-diffusion-4-5');

            // 计算 variety_boost 的 skip_cfg_above_sigma
            let skipCfgAboveSigma = null;
            if (p.variety_boost) {
                const magicConstant = isV45 ? 58 : 19;
                const pixelCount = width * height;
                const ratio = pixelCount / 1011712;
                skipCfgAboveSigma = Math.pow(ratio, 0.5) * magicConstant;
            }

            // 构建请求体
            const requestBody = {
                action: 'generate',
                input: String(baseCaption || ''),
                model: modelName,
                parameters: {
                    params_version: 3,
                    width,
                    height,
                    scale: params.cfg || p.cfg || 6,
                    seed,
                    sampler: params.sampler || p.sampler || 'k_euler_ancestral',
                    noise_schedule: p.scheduler || 'karras',
                    steps: params.steps || p.steps || 28,
                    n_samples: 1,
                    ucPreset: p.ucPreset || 0,
                    qualityToggle: p.qualityToggle !== undefined ? p.qualityToggle : true,
                    autoSmea: p.autoSmea !== undefined ? p.autoSmea : false,
                    cfg_rescale: p.cfg_rescale || 0,
                    dynamic_thresholding: p.decrisper !== undefined ? p.decrisper : false,
                    controlnet_strength: 1,
                    legacy: false,
                    add_original_image: true,
                    legacy_v3_extend: false,
                    use_coords: false,
                    legacy_uc: false,
                    normalize_reference_strength_multiple: true,
                    inpaintImg2ImgStrength: 1,
                    deliberate_euler_ancestral_bug: false,
                    prefer_brownian: true,
                    image_format: 'png',
                    skip_cfg_above_sigma: skipCfgAboveSigma,
                    sm: p.sm !== undefined ? p.sm : false,
                    sm_dyn: p.sm_dyn !== undefined ? p.sm_dyn : false,
                    characterPrompts: [],
                    v4_prompt: {
                        caption: {
                            base_caption: String(baseCaption || ''),
                            char_captions: charCaptions
                        },
                        use_coords: false,
                        use_order: true
                    },
                    v4_negative_prompt: {
                        caption: {
                            base_caption: String(finalNegative || ''),
                            char_captions: []
                        },
                        legacy_uc: false
                    },
                    negative_prompt: String(finalNegative || '')
                }
            };

            console.log('[NovelAI] 请求:', requestBody);

            const response = await fetch('https://image.novelai.net/ai/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiToken}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[NovelAI] 生成失败:', response.status, errText);
                if (response.status === 402) {
                    return { success: false, error: 'Anlas 不足，请充值' };
                }
                return { success: false, error: `API 错误 (${response.status}): ${errText}` };
            }

            // NovelAI 返回 ZIP 格式
            const zipData = await response.arrayBuffer();
            const base64 = await this._extractImageFromZip(zipData);

            if (base64) {
                console.log('[NovelAI] 生成成功');
                return { success: true, base64, format: 'png' };
            } else {
                return { success: false, error: '无法从 ZIP 中提取图片' };
            }
        } catch (e) {
            console.error('[NovelAI] 异常:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * 从 ZIP 中提取 PNG 图片
     */
    async _extractImageFromZip(zipData) {
        try {
            // 动态加载 JSZip
            if (!window.JSZip) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const zip = await window.JSZip.loadAsync(zipData);
            const file = Object.values(zip.files).find(f => f.name.endsWith('.png') || f.name.endsWith('.webp'));
            if (!file) return null;
            return await file.async('base64');
        } catch (e) {
            console.error('[NovelAI] ZIP 解析失败:', e);
            return null;
        }
    },

    // ============ 配置相关 ============

    getDefaultConfig() {
        return {
            apiToken: '',
            model: 'nai-diffusion-4-5-full',
            promptPrefix: '',
            testPrompt: '1girl, masterpiece, best quality',
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
                cfg_rescale: 0,
                ucPreset: 0
            },
            undesiredContent: 'lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'
        };
    },

    getConfigFields() {
        return [
            { key: 'apiToken', label: 'API Token', type: 'password' },
            { key: 'model', label: '模型', type: 'select', options: this.MODELS }
        ];
    },

    renderConfigUI(config) {
        const c = { ...this.getDefaultConfig(), ...config };
        const p = c.defaultParams || {};

        const modelOptions = this.MODELS.map(m =>
            `<option value="${m.id}" ${c.model === m.id ? 'selected' : ''}>${m.name}</option>`
        ).join('');

        const samplerOptions = this.SAMPLERS.map(s =>
            `<option value="${s.id}" ${p.sampler === s.id ? 'selected' : ''}>${s.name}</option>`
        ).join('');

        const schedulerOptions = this.SCHEDULERS.map(s =>
            `<option value="${s.id}" ${p.scheduler === s.id ? 'selected' : ''}>${s.name}</option>`
        ).join('');

        const resolutionOptions = this.RESOLUTIONS.map(r =>
            `<option value="${r.w}x${r.h}" ${p.width === r.w && p.height === r.h ? 'selected' : ''}>${r.label}</option>`
        ).join('');

        return `
            <div class="sd-connector-config" data-connector="novelai">
                <!-- 1. API 授权与模型设置卡片 -->
                <div class="sd-card">
                    <h4 style="margin-top:0; margin-bottom:15px; font-weight:600; color:var(--nm-text);">🔑 授权与模型配置</h4>
                    
                    <div class="sd-api-row">
                        <label>API Token</label>
                        <input type="password" id="sd-novelai-token" class="text_pole" 
                               placeholder="pst-xxxxxxxx (从 NovelAI 账户设置获取)" value="${c.apiToken || ''}">
                    </div>
                    <small style="color: var(--nm-text-muted); display: block; margin-left: 112px; margin-top: -6px; margin-bottom: 12px; font-size: 0.82em;">
                        请填入以 <code>pst-</code> 开头的持久访问令牌
                    </small>

                    <div class="sd-api-row">
                        <label>模型版本</label>
                        <select id="sd-novelai-model" class="text_pole">${modelOptions}</select>
                    </div>

                    <button id="sd-novelai-test" class="sd-btn-secondary" style="width:100%; margin-top:10px;">🧪 测试API连接</button>
                </div>

                <!-- 2. 生图基础参数卡片 (精简两排布局) -->
                <div class="sd-card">
                    <h4 style="margin-top:0; margin-bottom:15px; font-weight:600; color:var(--nm-text);">⚙️ 生图基础参数</h4>

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
                    <h4 style="margin-top:0; margin-bottom:15px; font-weight:600; color:var(--nm-text);">🚀 进阶功能与采样优化</h4>

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
                            <span style="font-weight:600;">Auto SMEA (大图自适应)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">在大图或高分辨率时自动启用 SMEA 算法，防止大图肢体崩坏</small>
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
                            <span style="font-weight:600;">多角色分层解析 (V4+)</span>
                            <small style="color:var(--nm-text-muted); display:block; margin-top:2px;">允许使用 <code>&lt;char&gt;特征...&lt;/char&gt;</code> 独立描绘多名角色，彻底防止特征相互污染</small>
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
                    <h4 style="margin-top:0; margin-bottom:15px; font-weight:600; color:var(--nm-text);">🖼️ 测试生图</h4>
                    
                    <div style="display:flex; gap:8px; margin-bottom:12px;">
                        <input type="text" id="sd-novelai-test-prompt" class="text_pole" 
                               placeholder="输入测试提示词，如: 1girl, masterpiece, best quality" 
                               style="flex:1;" value="${c.testPrompt || '1girl, masterpiece, best quality'}">
                        <button id="sd-novelai-test-gen" class="sd-btn-primary" style="white-space:nowrap; padding:8px 16px;">🎨 生成测试</button>
                    </div>

                    <div id="sd-novelai-test-result" style="text-align:center; min-height:100px; background:rgba(0,0,0,0.2); border-radius:var(--nm-radius-sm); padding:16px; display:flex; align-items:center; justify-content:center; border:1px dashed var(--nm-border);">
                        <span style="color:var(--nm-text-muted); font-size:0.9em;">点击上方“生成测试”按钮测试连接与效果</span>
                    </div>
                </div>

                <!-- 5. 资费提示卡片 -->
                <div class="sd-card" style="border-left: 3px solid var(--nm-accent); background: rgba(96, 205, 255, 0.05); padding: 12px 16px; margin-bottom: 0;">
                    <div style="display:flex; align-items:center; gap:8px; color:var(--nm-accent); font-size:0.88em; font-weight:500;">
                        <span>💡</span>
                        <span>NovelAI 为第三方付费生图服务，测试及对话生图均会消耗账户 Anlas 点数。</span>
                    </div>
                </div>
            </div>`;
    },

    parseConfigFromUI(existingConfig = {}) {
        const resolution = $('#sd-novelai-resolution').val()?.split('x') || ['832', '1216'];

        return {
            apiToken: ($('#sd-novelai-token').val() || '').trim(),
            model: $('#sd-novelai-model').val() || 'nai-diffusion-4-5-full',
            testPrompt: ($('#sd-novelai-test-prompt').val() || '1girl, masterpiece, best quality').trim(),
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
                cfg_rescale: 0,
                ucPreset: 0
            },
            undesiredContent: existingConfig.undesiredContent || ''
        };
    },

    bindEvents(context = {}) {
        const toastr = context.toastr || window.toastr;

        // 测试连接按钮
        $('#sd-novelai-test').off('click.nai').on('click.nai', async function () {
            const btn = $(this);
            btn.prop('disabled', true).text('⏳ 测试中...');
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
                btn.prop('disabled', false).text('🧪 测试API连接');
            }
        });

        // 测试生图按钮
        $('#sd-novelai-test-gen').off('click.nai').on('click.nai', async function () {
            const btn = $(this);
            const $result = $('#sd-novelai-test-result');
            const testPrompt = ($('#sd-novelai-test-prompt').val() || '1girl, masterpiece, best quality').trim();

            btn.prop('disabled', true).text('⏳ 生成中...');
            $result.html(`
                <div class="sd-skeleton-img" style="min-height:120px; display:flex; align-items:center; justify-content:center; color:var(--nm-accent); font-size:0.9em; gap:8px;">
                    <span style="font-size: 1.2em;">⏳</span>
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
                            <small style="color:var(--nm-text-muted); font-size:0.8em;">✅ 生成成功 (${config.model || 'NovelAI'})</small>
                        </div>
                    `);
                    if (toastr) toastr.success('测试图片生成成功！', 'NovelAI');
                } else {
                    $result.html(`
                        <div style="color: #ff6b6b; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <span style="font-size: 1.3em;">❌</span>
                            <span style="font-size: 0.9em; font-weight: 500;">生成失败: ${genResult.error || '未知错误'}</span>
                        </div>
                    `);
                    if (toastr) toastr.error(genResult.error || '生成失败', 'NovelAI');
                }
            } catch (e) {
                $result.html(`
                    <div style="color: #ff6b6b; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <span style="font-size: 1.3em;">❌</span>
                        <span style="font-size: 0.9em; font-weight: 500;">请求失败: ${e.message}</span>
                    </div>
                `);
                if (toastr) toastr.error(e.message, 'NovelAI');
            } finally {
                btn.prop('disabled', false).text('🎨 生成测试');
            }
        });
    },

    validateConfig(config) {
        if (!config.apiToken) {
            return { valid: false, errors: ['请配置 API Token'] };
        }
        return { valid: true, errors: [] };
    }
};

// 注册连接器
if (typeof window !== 'undefined') {
    window.SD_CONNECTORS = window.SD_CONNECTORS || [];
    window.SD_CONNECTORS.push(NovelAIConnector);
    window.SD_NovelAIConnector = NovelAIConnector;
}
