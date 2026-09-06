// グローバル変数
let printer = null;

// 端末が最新版を読み込めているかメニューで確認できるようにする
const APP_VERSION = (function() {
    const src = document.currentScript ? document.currentScript.src : '';
    const matched = src.match(/[?&]v=([^&]+)/);
    return matched ? matched[1] : 'dev';
})();

// デバイス判定関数
function isMobileDevice() {
    const ua = navigator.userAgent.toLowerCase();
    // iPad, iPhone, iPod, Androidを検出
    const isMobile = /iphone|ipad|ipod|android/.test(ua) || 
                     // iPad Pro等の新しいiPadはMacintoshと表示されることがある
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    console.log('User Agent:', ua);
    console.log('Platform:', navigator.platform);
    console.log('MaxTouchPoints:', navigator.maxTouchPoints);
    console.log('モバイルデバイス判定:', isMobile);
    return isMobile;
}

// 連番の保存と読み込み
function saveSerialNumber(number) {
    localStorage.setItem('serialNumber', number);
    console.log('連番を保存しました:', number);
}

function loadSerialNumber() {
    const saved = localStorage.getItem('serialNumber');
    return saved ? parseInt(saved) : 1;
}

function updateSerialDisplay() {
    const currentSerial = loadSerialNumber();
    const display = document.getElementById('currentSerial');
    if (display) {
        display.textContent = currentSerial;
    }
}

// プリンター選択の保存と読み込み
function savePrinterSelection(printer) {
    localStorage.setItem('selectedPrinter', printer);
    console.log('プリンター選択を保存しました:', printer);
}

function loadPrinterSelection() {
    const saved = localStorage.getItem('selectedPrinter');
    return normalizePrinterId(saved) || 'printassist';
}

function normalizePrinterId(printer) {
    if (printer === 'printassist' || printer === 'tmassistant' || printer === 'mpb20' || printer === 'sms210i' || printer === 'nimbotb1') {
        return printer;
    }
    return null;
}

function printerDisplayName(printer) {
    const labels = {
        printassist: 'TM Print Assistant',
        tmassistant: 'TM Assistant',
        mpb20: 'MP-B20',
        sms210i: 'SM-S210i',
        nimbotb1: 'NIMBOT B1'
    };
    return labels[printer] || 'TM Print Assistant';
}

function applyPrinterSelection(printer, options) {
    const normalized = normalizePrinterId(printer);
    if (!normalized) return false;

    savePrinterSelection(normalized);
    updatePrinterDisplay(normalized);
    if (normalized === 'mpb20' || normalized === 'sms210i' || normalized === 'nimbotb1') {
        preloadMpb20FontIfSelected();
    }

    if (options && options.notify) {
        showMessage('プリンターを' + printerDisplayName(normalized) + 'に設定しました', 'success');
    }
    return true;
}

function updatePrinterDisplay(printer) {
    const printAssistBtn = document.getElementById('printAssistOption');
    const tmAssistantBtn = document.getElementById('tmAssistantOption');
    const mpB20Btn = document.getElementById('mpB20Option');
    const smS210iBtn = document.getElementById('smS210iOption');
    const nimbotB1Btn = document.getElementById('nimbotB1Option');
    const printerInfo = document.getElementById('printerInfo');

    [printAssistBtn, tmAssistantBtn, mpB20Btn, smS210iBtn, nimbotB1Btn].forEach(function(btn) {
        if (btn) btn.classList.remove('active');
    });

    if (printer === 'tmassistant' && tmAssistantBtn) {
        tmAssistantBtn.classList.add('active');
    } else if (printer === 'mpb20' && mpB20Btn) {
        mpB20Btn.classList.add('active');
    } else if (printer === 'sms210i' && smS210iBtn) {
        smS210iBtn.classList.add('active');
    } else if (printer === 'nimbotb1' && nimbotB1Btn) {
        nimbotB1Btn.classList.add('active');
    } else if (printAssistBtn) {
        printAssistBtn.classList.add('active');
        printer = 'printassist';
    }

    if (printerInfo) {
        if (printer === 'nimbotb1') {
            const paper = loadNimbotPaperMode();
            const paperLabel = paper === 'continuous' ? '58mm連続紙' : 'ラベル50×30';
            if (isNimbotWebBluetoothAvailable()) {
                printerInfo.textContent = '現在: NIMBOT B1 / ' + paperLabel + '（Bluetooth直印字可）';
            } else if (isAppleMobileDevice()) {
                printerInfo.textContent = '現在: NIMBOT B1 / ' + paperLabel + '（Bluefy経由）';
            } else {
                printerInfo.textContent = '現在: NIMBOT B1 / ' + paperLabel;
            }
        } else {
            printerInfo.textContent = '現在: ' + printerDisplayName(printer);
        }
    }

    updateNimbotPaperModeUi(printer);
}

function loadNimbotPaperMode() {
    const saved = localStorage.getItem('nimbotPaperMode');
    return saved === 'continuous' ? 'continuous' : 'label';
}

function saveNimbotPaperMode(mode) {
    const normalized = mode === 'continuous' ? 'continuous' : 'label';
    localStorage.setItem('nimbotPaperMode', normalized);
    return normalized;
}

function updateNimbotPaperModeUi(printer) {
    const wrap = document.getElementById('nimbotPaperMode');
    const labelBtn = document.getElementById('nimbotPaperLabel');
    const continuousBtn = document.getElementById('nimbotPaperContinuous');
    if (!wrap) return;

    const show = printer === 'nimbotb1';
    wrap.hidden = !show;
    if (!show) return;

    const mode = loadNimbotPaperMode();
    if (labelBtn) labelBtn.classList.toggle('active', mode === 'label');
    if (continuousBtn) continuousBtn.classList.toggle('active', mode === 'continuous');
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // NIMBOT B1の自動印字（Bluefy等からの復帰）を先に処理
    const autoPrinted = maybeHandleNimbotAutoprintFromUrl();
    if (!autoPrinted) {
        // URLパラメータから値札データを読み込む
        loadFromURL();
    }
    
    // 保存された連番を読み込む（内部管理のみ）
    const savedSerial = loadSerialNumber();
    console.log('保存された連番を読み込みました:', savedSerial);
    updateSerialDisplay();
    
    // 保存されたプリンター選択を読み込む
    const savedPrinter = loadPrinterSelection();
    updatePrinterDisplay(savedPrinter);
    console.log('保存されたプリンター選択を読み込みました:', savedPrinter);
    
    // プリンター選択ボタン
    document.getElementById('printAssistOption').addEventListener('click', function() {
        applyPrinterSelection('printassist', { notify: true });
    });
    
    document.getElementById('tmAssistantOption').addEventListener('click', function() {
        applyPrinterSelection('tmassistant', { notify: true });
    });

    document.getElementById('mpB20Option').addEventListener('click', function() {
        applyPrinterSelection('mpb20', { notify: true });
    });

    document.getElementById('smS210iOption').addEventListener('click', function() {
        applyPrinterSelection('sms210i', { notify: true });
    });

    document.getElementById('nimbotB1Option').addEventListener('click', function() {
        applyPrinterSelection('nimbotb1', { notify: true });
    });

    const nimbotPaperLabel = document.getElementById('nimbotPaperLabel');
    const nimbotPaperContinuous = document.getElementById('nimbotPaperContinuous');
    if (nimbotPaperLabel) {
        nimbotPaperLabel.addEventListener('click', function() {
            saveNimbotPaperMode('label');
            updatePrinterDisplay('nimbotb1');
            showMessage('NIMBOT用紙をラベル50×30に設定しました', 'success');
        });
    }
    if (nimbotPaperContinuous) {
        nimbotPaperContinuous.addEventListener('click', function() {
            saveNimbotPaperMode('continuous');
            updatePrinterDisplay('nimbotb1');
            showMessage('NIMBOT用紙を58mm連続紙（試作）に設定しました', 'success');
        });
    }
    
    // ハンバーガーメニューの設定
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sideMenu = document.getElementById('sideMenu');
    const closeMenu = document.getElementById('closeMenu');
    const overlay = document.getElementById('overlay');
    
    hamburgerMenu.addEventListener('click', function() {
        sideMenu.classList.add('active');
        overlay.classList.add('active');
        updateSerialDisplay();
    });
    
    closeMenu.addEventListener('click', function() {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    // オーバーレイクリック - サイドメニュー・履歴・パスワード確認を閉じる
    overlay.addEventListener('click', function() {
        if (document.getElementById('passwordModal').classList.contains('active')) {
            cancelQrPasswordPrompt();
            return;
        }
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
        closeHistoryModal();
    });
    
    // 連番設定ボタン
    document.getElementById('setSerialNumber').addEventListener('click', function() {
        const newSerial = document.getElementById('menuSerialNumber').value;
        if (newSerial && parseInt(newSerial) > 0) {
            saveSerialNumber(newSerial);
            updateSerialDisplay();
            updatePreview();
            showMessage('連番を ' + newSerial + ' に設定しました', 'success');
            document.getElementById('menuSerialNumber').value = '';
        } else {
            showMessage('有効な連番を入力してください', 'error');
        }
    });
    
    // 連番リセットボタン
    document.getElementById('resetSerialNumber').addEventListener('click', function() {
        if (confirm('連番を1にリセットしますか？')) {
            saveSerialNumber(1);
            updateSerialDisplay();
            updatePreview();
            showMessage('連番を1にリセットしました', 'success');
        }
    });
    
    // 履歴表示ボタン
    document.getElementById('showHistory').addEventListener('click', function() {
        showHistoryModal();
    });

    const scanBarcodeBtn = document.getElementById('scanBarcodeBtn');
    if (scanBarcodeBtn) {
        scanBarcodeBtn.addEventListener('click', function() {
            openBarcodeScanModal();
        });
    }
    const closeBarcodeScan = document.getElementById('closeBarcodeScan');
    if (closeBarcodeScan) {
        closeBarcodeScan.addEventListener('click', closeBarcodeScanModal);
    }
    const barcodeScanSubmit = document.getElementById('barcodeScanSubmit');
    if (barcodeScanSubmit) {
        barcodeScanSubmit.addEventListener('click', submitBarcodeScanInput);
    }
    const barcodeScanStop = document.getElementById('barcodeScanStop');
    if (barcodeScanStop) {
        barcodeScanStop.addEventListener('click', stopBarcodeCamera);
    }
    const barcodeScanInput = document.getElementById('barcodeScanInput');
    if (barcodeScanInput) {
        barcodeScanInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitBarcodeScanInput();
            }
        });
    }
    
    // 履歴モーダルを閉じる
    document.getElementById('closeHistory').addEventListener('click', function() {
        closeHistoryModal();
    });
    // 稼働方式の切り替え
    document.getElementById('operationType').addEventListener('change', function() {
        const otherGroup = document.getElementById('otherOperationGroup');
        if (this.value === 'other') {
            otherGroup.style.display = 'block';
        } else {
            otherGroup.style.display = 'none';
        }
        updatePreview();
    });
    
    document.getElementById('otherOperation').addEventListener('input', updatePreview);
    
    // カテゴリーの切り替え
    document.getElementById('categoryType').addEventListener('change', function() {
        const otherCatGroup = document.getElementById('otherCategoryGroup');
        if (this.value === 'other') {
            otherCatGroup.style.display = 'block';
        } else {
            otherCatGroup.style.display = 'none';
        }
        updatePreview();
    });
    
    document.getElementById('otherCategory').addEventListener('input', updatePreview);
    
    // リアルタイムプレビューの設定
    const modelNumberField = document.getElementById('modelNumber');
    
    // かな漢字変換の途中で値を書き換えると、確定時にIMEが変換前の内容へ戻してしまい、
    // 上限を超えた行がそのまま残ったり、1文字だけ別の行に取り残されたりする。
    // 変換中は折り返さず、確定した時点でまとめて折り返す
    let modelNumberComposing = false;

    modelNumberField.addEventListener('compositionstart', function() {
        modelNumberComposing = true;
    });

    modelNumberField.addEventListener('compositionend', function() {
        modelNumberComposing = false;
        autoLineBreakSmart(this, PRINT_LINE_UNITS);
        autoGrowTextarea(this);
        updatePreview();
    });

    // 型番の自由編集（手動改行可能、自動改行も行う）
    modelNumberField.addEventListener('input', function(e) {
        if (modelNumberComposing || e.isComposing) {
            autoGrowTextarea(this);
            return;
        }

        autoLineBreakSmart(this, PRINT_LINE_UNITS);
        autoGrowTextarea(this);
        updatePreview();
    });
    
    // Enterキーで手動改行（上限超過時は自動改行も行う）
    modelNumberField.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            // Enterキーで手動改行を許可
            return;
        }
    });
    
    // 貼り付け時にも同じ幅で自動改行
    modelNumberField.addEventListener('paste', function(e) {
        setTimeout(() => {
            autoLineBreakForPaste(this, PRINT_LINE_UNITS);
            autoGrowTextarea(this);
            updatePreview();
        }, 10);
    });

    fitTextareaToLineLength(modelNumberField, MODEL_LINE_CHARS);
    autoGrowTextarea(modelNumberField);

    // 画面回転や分割表示で幅が変わったら測り直す
    window.addEventListener('resize', function() {
        fitTextareaToLineLength(modelNumberField, MODEL_LINE_CHARS);
        autoGrowTextarea(modelNumberField);
    });

    document.getElementById('purchasePrice').addEventListener('input', updatePreview);
    document.getElementById('batteryCost').addEventListener('input', updatePreview);
    document.getElementById('beltCost').addEventListener('input', updatePreview);
    document.getElementById('desiredPrice').addEventListener('input', updatePreview);
    
    // ボタンイベント
    document.getElementById('printBtn').addEventListener('click', printLabel);
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    
    // 初回プレビュー更新
    updatePreview();

    setupBottomButtonReveal();

    // BIZ UDゴシックはMP-B20・TM系の画像印字で使うため先読みする
    preloadMpb20FontIfSelected();

    const versionLabel = document.getElementById('appVersion');
    if (versionLabel) versionLabel.textContent = APP_VERSION;

    // PWAの戻り先と案内文を表示
    const returnLabel = document.getElementById('returnTarget');
    if (returnLabel) {
        returnLabel.textContent = getPrintReturnUrl();
    }
    const returnHint = document.getElementById('returnHint');
    if (returnHint) {
        returnHint.textContent = getReturnHintText();
    }

    // 印刷を挟まずに、同じ戻り先を試せるようにする
    const testReturnButton = document.getElementById('testReturn');
    if (testReturnButton) {
        testReturnButton.addEventListener('click', function() {
            window.location.href = getPrintReturnUrl();
        });
    }

    const qrPasswordSubmit = document.getElementById('qrPasswordSubmit');
    const qrPasswordCancel = document.getElementById('qrPasswordCancel');
    const qrPasswordInput = document.getElementById('qrPasswordInput');
    if (qrPasswordSubmit) qrPasswordSubmit.addEventListener('click', submitQrPasswordPrompt);
    if (qrPasswordCancel) qrPasswordCancel.addEventListener('click', cancelQrPasswordPrompt);
    if (qrPasswordInput) {
        qrPasswordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitQrPasswordPrompt();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelQrPasswordPrompt();
            }
        });
    }
});

// プレビュー更新関数（プレビュー表示は削除されたが、内部処理のため残す）
function updatePreview() {
    // この関数は内部処理用に残しますが、プレビュー表示は行いません
}

// 印刷関数
function printLabel() {
    const serialNumber = loadSerialNumber().toString();
    const modelNumber = document.getElementById('modelNumber').value;
    const categoryType = document.getElementById('categoryType').value;
    const otherCategory = document.getElementById('otherCategory').value;
    const operationType = document.getElementById('operationType').value;
    const otherOperation = document.getElementById('otherOperation').value;
    const purchasePrice = document.getElementById('purchasePrice').value;
    const batteryCost = document.getElementById('batteryCost').value;
    const beltCost = document.getElementById('beltCost').value;
    const desiredPrice = document.getElementById('desiredPrice').value;
    
    // カテゴリーの取得
    let category = '';
    if (categoryType === 'other' && otherCategory) {
        category = otherCategory;
    } else if (categoryType !== 'other') {
        category = categoryType;
    }
    
    // 稼働方式の取得
    let operation = '';
    if (operationType === 'other' && otherOperation) {
        operation = otherOperation;
    } else if (operationType !== 'other') {
        operation = operationType;
    }
    
    // 入力チェック（型番と希望金額のみ必須）
    if (!modelNumber || !desiredPrice) {
        showMessage('必須項目（型番、希望金額）を入力してください', 'error');
        return;
    }
    
    // 選択されたプリンターに応じた印刷処理
    const selectedPrinter = loadPrinterSelection();
    
    // デバイス判定を実行（デバッグ用）
    const isMobile = isMobileDevice();
    console.log('印刷実行時のデバイス判定:', isMobile);
    
    // モバイルデバイスでない場合は警告を表示（ただし印刷は続行）
    if (!isMobile) {
        console.warn('モバイルデバイスではありませんが、印刷を試行します');
    }
    
    if (selectedPrinter === 'printassist') {
        console.log('TM Print Assistant印刷を使用');
        printWithPrintAssist(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
    } else if (selectedPrinter === 'tmassistant') {
        console.log('TM Assistant印刷を使用');
        printWithTMAssistant(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
    } else if (selectedPrinter === 'mpb20') {
        console.log('MP-B20印刷を使用');
        printWithMPB20(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
    } else if (selectedPrinter === 'sms210i') {
        console.log('SM-S210i印刷を使用');
        printWithSMS210i(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
    } else if (selectedPrinter === 'nimbotb1') {
        console.log('NIMBOT B1印刷を使用');
        printWithNimbotB1(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
    } else {
        showMessage('プリンター選択が不正です', 'error');
    }
}

// 入力量に応じて型番欄の高さを広げる（文字数制限なし）
function autoGrowTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// 入力欄の幅が1行ぶんの文字数に足りないと、こちらで折り返した行の末尾がブラウザ側で
// さらに折り返され、1文字だけ次の行に取り残されて見える。
// 端末幅は機種によって変わるので、実際の文字幅を測って足りない分だけ字間を詰める。
// 表示だけの調整で、入力値や印字内容は変えない
function fitTextareaToLineLength(textarea, charsPerLine) {
    if (!textarea) return;

    textarea.style.letterSpacing = '';
    const style = window.getComputedStyle(textarea);
    const inner = textarea.clientWidth -
        parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    if (!(inner > 0)) return;

    const context = fitTextareaToLineLength.context ||
        (fitTextareaToLineLength.context = document.createElement('canvas').getContext('2d'));
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    // 全角が最も広いので、全角が収まれば半角も収まる
    const lineWidth = context.measureText('あ'.repeat(charsPerLine)).width;
    const surplus = inner - lineWidth - 1; // 端数で溢れないよう1px余裕を見る
    if (surplus >= 0) return;

    const spacing = Math.max(surplus / charsPerLine, -1);
    textarea.style.letterSpacing = spacing.toFixed(2) + 'px';
}

function setupBottomButtonReveal() {
    const buttonSection = document.getElementById('buttonSection');
    if (!buttonSection) return;

    const mobileQuery = window.matchMedia('(max-width: 768px)');

    function applyVisibility(isAtBottom) {
        if (!mobileQuery.matches) {
            buttonSection.classList.add('is-visible');
            return;
        }
        buttonSection.classList.toggle('is-visible', isAtBottom);
    }

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            applyVisibility(entry.isIntersecting);
        });
    }, { root: null, threshold: 0.6, rootMargin: '0px 0px -8px 0px' });

    observer.observe(buttonSection);

    mobileQuery.addEventListener('change', function() {
        if (!mobileQuery.matches) {
            buttonSection.classList.add('is-visible');
        } else {
            buttonSection.classList.remove('is-visible');
        }
    });
}

function buildLabelPrintData(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    const now = new Date();
    const printNotice = document.getElementById('printNotice').checked;
    // 型番は入力された表記のまま印字する。
    // 英数字を全角にすると1文字ずつ全角の枠に収まって字間が空き、
    // 日本語の行から浮いてしまう
    const modelLines = modelNumber.includes('\n')
        ? modelNumber.split('\n')
        : splitTextByWidth(modelNumber, PRINT_LINE_UNITS);

    const operationLines = operation ? splitOperationText(toFullWidth(operation)) : [];

    const priceLines = [];
    if (purchasePrice) priceLines.push(buildPriceLine('購入価格', purchasePrice));
    if (batteryCost) priceLines.push(buildPriceLine('電池代', batteryCost));
    if (beltCost) priceLines.push(buildPriceLine('ベルト代', beltCost));

    return {
        headerLine: `T❜s time   ${formatSerialDigits5FullWidth(serialNumber)}`,
        category: category || '',
        modelLines: modelLines,
        operationLines: operationLines,
        priceLines: priceLines,
        desiredLine: formatPriceFullWidth(desiredPrice) + '円',
        printNotice: printNotice,
        noticeLines: printNotice ? [
            '大幅に金額が離れている場合は',
            'お売りする事が出来ません。',
            'ご了承下さい。'
        ] : [],
        dateString: formatDateJPFullWidth(now),
        qrcodeNumber: buildQrcodeNumberFullWidth(now, serialNumber),
        dataURL: generateDataURL(modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice, serialNumber)
    };
}

// TM Print Assistant / TM Assistant用のラベルデータ。
// プリンター内蔵フォントでは全角が半角の倍幅になるため、
// 全角に揃えたMP-B20用データ（buildLabelPrintData）は流用できない。
// 半角前提の当初のレイアウトをそのまま使う
function buildEposLabelData(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    const now = new Date();
    const dateString = `${now.getFullYear()}年${(now.getMonth()+1).toString().padStart(2,'0')}月${now.getDate().toString().padStart(2,'0')}日`;
    const qrcodeNumber = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${serialNumber.padStart(5, '0')}`;

    // width="1"の1行は半角32文字分。文字数で切ると全角の型番が用紙幅を超える
    const modelLines = modelNumber.includes('\n')
        ? modelNumber.split('\n')
        : splitTextByWidth(modelNumber, PRINT_LINE_UNITS);

    const priceLines = [];
    if (purchasePrice) {
        const priceNum = Number(purchasePrice);
        // 10万以上は1行に収まらないので見出しと金額を分ける
        if (priceNum >= 100000) {
            priceLines.push('購入価格');
            priceLines.push(`${priceNum.toLocaleString()}円`);
        } else {
            priceLines.push(`購入価格${priceNum.toLocaleString()}円`);
        }
    }
    if (batteryCost) priceLines.push(`電池代${Number(batteryCost).toLocaleString()}円`);
    if (beltCost) priceLines.push(`ベルト代${Number(beltCost).toLocaleString()}円`);

    return {
        serialHalfWidth: serialNumber.padStart(5, '0'),
        category: category || '',
        modelLines: modelLines,
        operation: operation || '',
        priceLines: priceLines,
        desiredLine: `${Number(desiredPrice).toLocaleString()}円`,
        printNotice: document.getElementById('printNotice').checked,
        dateString: dateString,
        qrcodeNumber: qrcodeNumber,
        dataURL: generateDataURL(modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice, serialNumber)
    };
}

function buildEposPrintXml(labelData) {
    let xml = '<?xml version="1.0" encoding="utf-8"?>';
    xml += '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">';
    // TM-P20IIは既定がFont B(42桁)でTM-m30系と桁が違うことがあるため、
    // Font A(半角32桁 / 全角16桁)に固定してレイアウトを安定させる
    xml += '<text lang="ja" font="font_a"/>';

    // ヘッダーは1行に詰めると「’」や機種差で連番が欠ける。
    // ブランドと連番を分け、ASCIIのアポストロフィで幅を確保する。
    // height=2 + em でTM-P20IIの細い印字を目立たせる
    xml += '<text align="center" width="2" height="2" em="true"/>';
    xml += '<text>T\'s time&#10;</text>';
    xml += `<text>${escapeXml(labelData.serialHalfWidth)}&#10;&#10;</text>`;

    // 本文も強調印字にして細く見えないようにする
    xml += '<text align="center" width="1" height="1" em="true"/>';
    if (labelData.category) {
        xml += `<text>${escapeXml(labelData.category)}&#10;&#10;</text>`;
    }

    for (let line of labelData.modelLines) {
        xml += `<text>${escapeXml(line)}&#10;</text>`;
    }
    xml += '<text>&#10;</text>';

    if (labelData.operation) {
        xml += `<text>${escapeXml(labelData.operation)}&#10;&#10;</text>`;
    }

    for (let line of labelData.priceLines) {
        xml += `<text>${escapeXml(line)}&#10;</text>`;
    }

    xml += '<text>&#10;</text>';

    xml += '<text width="2" height="2" em="true"/>';
    xml += `<text>${escapeXml(labelData.desiredLine)}&#10;&#10;</text>`;

    if (labelData.printNotice) {
        // 注意文は少し大きく。特殊記号﹡は機種によって欠けるので * にする
        xml += '<text width="1" height="2" em="true"/>';
        xml += '<text>*大幅に金額が離れている場合は&#10;</text>';
        xml += '<text>お売りする事が出来ません。&#10;</text>';
        xml += '<text>ご了承下さい。&#10;&#10;</text>';
    }

    xml += '<text width="1" height="1" em="true"/>';
    xml += `<text>${escapeXml(labelData.dateString)}&#10;</text>`;
    // 日付と点線の間に約2mm空ける（203dpi換算で16ドット）
    xml += '<feed unit="16"/>';
    // 点線を少し太く見せるため高さを一段上げる
    xml += '<text width="1" height="2" em="true"/>';
    xml += '<text>- - - - - - - - - - - - - - - -&#10;&#10;</text>';

    xml += `<symbol type="qrcode_model_2" level="h" width="3" height="0" size="0">${escapeXml(labelData.dataURL)}</symbol>`;
    xml += '<text width="1" height="1" em="true"/>';
    xml += `<text>&#10;${escapeXml(labelData.qrcodeNumber)}&#10;</text>`;
    xml += '<feed line="2"/>';
    xml += '<cut type="feed"/>';
    xml += '</epos-print>';

    return xml;
}

// ホーム画面から起動したWebアプリ（スタンドアロン）かどうか
function isStandaloneWebApp() {
    return window.navigator.standalone === true ||
           (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
}

function isAndroidDevice() {
    return /android/i.test(navigator.userAgent || '');
}

function isIosDevice() {
    const ua = navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// ホーム画面のWebアプリはhttpsのURLでは開けず、渡してもSafariが別に開いてしまう。
// インストール済みのWebアプリ本体を起動できるのはwebapp://スキームだけ。
// ただしホーム画面へ追加した時のURLと1文字でも違うと開けないため、
// 「/」で終わる形と「index.html」で終わる形の両方を用意しておく
function buildWebAppReturnUrls() {
    const host = window.location.host;
    const path = window.location.pathname;
    const primary = 'webapp://' + host + path;
    const alternate = path.endsWith('/')
        ? 'webapp://' + host + path + 'index.html'
        : 'webapp://' + host + path.replace(/[^/]*$/, '');

    return { primary: primary, alternate: alternate };
}

// iOSショートカットの「URLを開く」なら、Safariから塞がれていてもwebapp://を起動できる。
// そのショートカットを外部から呼ぶための名前（利用者が同じ名前で1つ作成する）
const RETURN_SHORTCUT_NAME = 'Tstime';

function getShortcutReturnUrl() {
    return 'shortcuts://run-shortcut?name=' + encodeURIComponent(RETURN_SHORTCUT_NAME);
}

function getHttpsAppUrl() {
    return window.location.origin + window.location.pathname;
}

// 印刷アプリからの戻り先URL。
// iOSのホーム画面アプリはショートカット経由、AndroidのPWAはhttpsのまま戻す
function getPrintReturnUrl() {
    if (isStandaloneWebApp()) {
        if (isAndroidDevice()) {
            return getHttpsAppUrl();
        }
        if (isIosDevice()) {
            return getShortcutReturnUrl();
        }
    }
    return getHttpsAppUrl();
}

function getReturnHintText() {
    if (isAndroidDevice()) {
        return 'AndroidではChromeメニュー「アプリをインストール」または「ホーム画面に追加」で使えます。印刷後は同じアプリへ戻ります。';
    }
    if (isIosDevice()) {
        return '印刷後と同じく、ショートカット「Tstime」が自動で開きます';
    }
    return '印刷後の戻り方は端末により異なります';
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // file:// では登録できない。https / localhost のみ
    if (window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1') {
        return;
    }

    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function(registration) {
            console.log('Service Worker登録完了:', registration.scope);
        }).catch(function(error) {
            console.warn('Service Worker登録失敗:', error);
        });
    });
}

registerServiceWorker();

// 印刷前の確認。
// キャンセルはApp Storeへ移動せず、入力内容を残したままこのアプリに留まる
function confirmPrint(appName) {
    const ok = confirm(`${appName}で印刷します。\n\n「OK」= 印刷する\n「キャンセル」= 印刷せずアプリに戻る`);
    if (!ok) {
        showMessage('印刷をキャンセルしました', 'success');
    }
    return ok;
}

// Epson TM Print Assistant印刷（iPad/iPhone/Android）
// TM-P20IIの内蔵フォントは字形が独特なため、BIZ UDゴシックで描いた画像を送る
async function printWithPrintAssist(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    console.log('=== TM Print Assistant印刷開始 ===');
    console.log('入力データ:', {serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice});

    if (!confirmPrint('Epson TM Print Assistant')) return;

    try {
        showMessage('綺麗なフォントで印字データを作成中...', 'success');
        const built = await buildTmRasterPrintXml(
            serialNumber, modelNumber, category, operation,
            purchasePrice, batteryCost, beltCost, desiredPrice
        );
        const xml = built.xml;

        console.log('ラスタサイズ:', built.raster.width, 'x', built.raster.height);
        console.log('生成されたXML文字数:', xml.length);

        const encodedXML = encodeURIComponent(xml);
        console.log('URLエンコード完了 / 文字数:', encodedXML.length);

        const returnUrl = getPrintReturnUrl();
        const successParam = returnUrl ? `success=${encodeURIComponent(returnUrl)}&` : '';
        const printURL = `tmprintassistant://tmprintassistant.epson.com/print?${successParam}ver=1&data-type=eposprintxml&reselect=yes&data=${encodedXML}`;
        console.log('完全なURLスキーム長:', printURL.length);

        if (printURL.length > 1200000) {
            throw new Error('印刷データが大きすぎます。型番を短くして再度お試しください');
        }

        showMessage('TM Print Assistantを起動します...', 'success');

        setTimeout(function() {
            const link = document.createElement('a');
            link.href = printURL;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showMessage('TM Print Assistantアプリに印刷データを送信しました', 'success');
        }, 500);

        saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);

        const newSerial = parseInt(serialNumber) + 1;
        saveSerialNumber(newSerial);
        updateSerialDisplay();
        updatePreview();

        showMessage('印刷データを送信しました。連番を ' + newSerial + ' に更新しました。', 'success');

    } catch (error) {
        console.error('=== TM Print Assistant印刷エラー ===', error);
        showMessage('印刷エラー: ' + error.message, 'error');
    }
}

// TM Assistant印刷（iPad/iPhone/Android）
async function printWithTMAssistant(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    console.log('=== TM Assistant印刷開始 ===');
    console.log('入力データ:', {serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice});

    if (!confirmPrint('TM Assistant')) return;

    try {
        showMessage('綺麗なフォントで印字データを作成中...', 'success');
        const built = await buildTmRasterPrintXml(
            serialNumber, modelNumber, category, operation,
            purchasePrice, batteryCost, beltCost, desiredPrice
        );
        const xml = built.xml;

        console.log('ラスタサイズ:', built.raster.width, 'x', built.raster.height);
        console.log('生成されたXML文字数:', xml.length);

        const base64XML = btoa(unescape(encodeURIComponent(xml)));
        console.log('Base64エンコード完了 / 文字数:', base64XML.length);

        const printURL = `tmassistant://print?data=${encodeURIComponent(base64XML)}`;
        console.log('完全なURLスキーム長:', printURL.length);

        if (printURL.length > 1200000) {
            throw new Error('印刷データが大きすぎます。型番を短くして再度お試しください');
        }

        showMessage('TM Assistantを起動します...', 'success');

        setTimeout(function() {
            const link = document.createElement('a');
            link.href = printURL;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showMessage('TM Assistantアプリに印刷データを送信しました', 'success');
        }, 500);

        saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);

        const newSerial = parseInt(serialNumber) + 1;
        saveSerialNumber(newSerial);
        updateSerialDisplay();
        updatePreview();

        showMessage('印刷データを送信しました。連番を ' + newSerial + ' に更新しました。', 'success');

    } catch (error) {
        console.error('=== TM Assistant印刷エラー ===', error);
        showMessage('印刷エラー: ' + error.message, 'error');
    }
}

// MP-B20印刷（SII URL Print Agent経由）
async function printWithMPB20(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    console.log('=== MP-B20印刷開始 ===');

    if (!confirmPrint('MP-B20（SII URL Print Agent）')) return;

    try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('PDF生成ライブラリの読み込みに失敗しました');
        }
        if (typeof QRCode === 'undefined') {
            throw new Error('QRコードライブラリの読み込みに失敗しました');
        }

        showMessage('MP-B20用の印刷データを作成中...', 'success');

        const labelData = buildLabelPrintData(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
        const pdfBase64 = await createMPB20LabelPdf(labelData);

        const returnUrl = getPrintReturnUrl();
        const callbackParams = returnUrl
            ? 'CallbackSuccess=' + encodeURIComponent(returnUrl) + '&' +
              'CallbackFail=' + encodeURIComponent(returnUrl) + '&'
            : '';
        const printURL =
            'siiprintagent://1.0/print?' +
            callbackParams +
            'BtKeepConnect=always&' +
            'Format=pdf&' +
            'Data=' + encodeURIComponent(pdfBase64) + '&' +
            // 既定の15秒ではBluetooth転送と印字が終わらず、値札の途中で打ち切られる。
            // 指定できる最大値まで延ばす
            'Timeout=300000&' +
            'ErrorDialog=yes&' +
            'SelectOnError=yes&' +
            'PaperWidth=58&' +
            'FitToWidth=no&' +
            'CutType=off&' +
            'CutFeed=no&' +
            'Dither=no';

        console.log('MP-B20 URL scheme length:', printURL.length);

        saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
        const newSerial = parseInt(serialNumber, 10) + 1;
        saveSerialNumber(newSerial);
        updateSerialDisplay();
        updatePreview();

        setTimeout(function() {
            const link = document.createElement('a');
            link.href = printURL;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showMessage('SII URL Print Agentへ送信しました。連番を ' + newSerial + ' に更新しました。', 'success');
        }, 300);
    } catch (error) {
        console.error('=== MP-B20印刷エラー ===', error);
        showMessage('MP-B20印刷エラー: ' + error.message, 'error');
    }
}

// SM-S210i印刷（Star PassPRNT経由）
async function printWithSMS210i(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    console.log('=== SM-S210i印刷開始 ===');

    if (!confirmPrint('SM-S210i（Star PassPRNT）')) return;

    try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('PDF生成ライブラリの読み込みに失敗しました');
        }
        if (typeof QRCode === 'undefined') {
            throw new Error('QRコードライブラリの読み込みに失敗しました');
        }

        showMessage('SM-S210i用の印刷データを作成中...', 'success');

        const labelData = buildLabelPrintData(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
        const pdfBase64 = await createSms210iLabelPdf(labelData);

        const returnUrl = getPrintReturnUrl();
        if (!returnUrl) {
            throw new Error('印刷後の戻り先を用意できませんでした');
        }

        // size=2 は SM-S210i の印字幅 384dot（48mm）
        const printURL =
            'starpassprnt://v1/print/nopreview?' +
            'back=' + encodeURIComponent(returnUrl) + '&' +
            'size=2&' +
            'cut=nocut&' +
            'timeout=300000&' +
            'popup=enable&' +
            'pdf=' + encodeURIComponent(pdfBase64);

        console.log('SM-S210i URL scheme length:', printURL.length);

        if (printURL.length > 1200000) {
            throw new Error('印刷データが大きすぎます。型番を短くして再度お試しください');
        }

        saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
        const newSerial = parseInt(serialNumber, 10) + 1;
        saveSerialNumber(newSerial);
        updateSerialDisplay();
        updatePreview();

        setTimeout(function() {
            const link = document.createElement('a');
            link.href = printURL;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showMessage('Star PassPRNTへ送信しました。連番を ' + newSerial + ' に更新しました。', 'success');
        }, 300);
    } catch (error) {
        console.error('=== SM-S210i印刷エラー ===', error);
        showMessage('SM-S210i印刷エラー: ' + error.message, 'error');
    }
}

// NIMBOT B1（Web Bluetooth直印字）。
// MP-B20/SM-S210iのような公式URLスキーム仲介アプリは無い。
// Android Chrome / PC Chrome / iPhoneのBluefyなら1タップで自動印字できる。
const NIMBOT_B1_MODEL = {
    label: 'Niimbot B1',
    id: 4096,
    dpi: 203,
    protocol: 'v4',
    task: 'b1',
    density: 3,
    label_type: 1, // ギャップラベル
    speed: 1,
    name_prefixes: ['B1']
};
// 連続紙（レシート用紙）試作。label_type=3。実印字幅は約48mmのまま。
const NIMBOT_B1_CONTINUOUS_MODEL = {
    label: 'Niimbot B1 Continuous',
    id: 4096,
    dpi: 203,
    protocol: 'v4',
    task: 'b1',
    density: 3,
    label_type: 3,
    speed: 1,
    name_prefixes: ['B1']
};
const NIMBOT_B1_SIZE = {
    label: '50 × 30 mm (B1)',
    code: 'T50*30',
    w_mm: 50,
    h_mm: 30,
    w_px: 384,
    h_px: 240,
    margin: 8,
    offset_y_px: 4,
    dpi: 203
};
const NIMBOT_B1_MAX_CONTINUOUS_HEIGHT_PX = 1600; // 約200mm。これ以上は切り詰め

function isNimbotWebBluetoothAvailable() {
    return !!(window.Niimbot && typeof Niimbot.isSupported === 'function' && Niimbot.isSupported());
}

function isAppleMobileDevice() {
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function buildNimbotAutoprintPageUrl(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    const url = new URL(window.location.href);
    url.hash = '';
    const params = new URLSearchParams();
    params.set('autoprint', 'nimbotb1');
    params.set('serial', String(serialNumber || ''));
    params.set('model', String(modelNumber || ''));
    params.set('category', String(category || ''));
    params.set('operation', String(operation || ''));
    params.set('price1', String(purchasePrice || ''));
    params.set('price2', String(batteryCost || ''));
    params.set('price3', String(beltCost || ''));
    params.set('price4', String(desiredPrice || ''));
    params.set('notice', document.getElementById('printNotice') && document.getElementById('printNotice').checked ? '1' : '0');
    // Bluefy印字後の戻り先（Safari / ホーム画面アプリ）
    params.set('back', getHttpsAppUrl());
    params.set('paper', loadNimbotPaperMode());
    url.search = params.toString();
    return url.toString();
}

function openNimbotPrintInBluefy(pageUrl) {
    // BluefyはiOS向けWeb Bluetooth対応ブラウザ。SafariからはこのURLで起動できる
    window.location.href = 'bluefy://open?url=' + encodeURIComponent(pageUrl);
}

function fillFormFromNimbotAutoprintParams(params) {
    const modelEl = document.getElementById('modelNumber');
    const desiredEl = document.getElementById('desiredPrice');
    const purchaseEl = document.getElementById('purchasePrice');
    const batteryEl = document.getElementById('batteryCost');
    const beltEl = document.getElementById('beltCost');
    const noticeEl = document.getElementById('printNotice');

    if (modelEl) modelEl.value = params.get('model') || '';
    if (desiredEl) desiredEl.value = params.get('price4') || '';
    if (purchaseEl) purchaseEl.value = params.get('price1') || '';
    if (batteryEl) batteryEl.value = params.get('price2') || '';
    if (beltEl) beltEl.value = params.get('price3') || '';
    if (noticeEl) noticeEl.checked = params.get('notice') === '1';

    const serialRaw = params.get('serial');
    const serialNum = serialRaw === null ? null : Number(serialRaw);
    if (Number.isSafeInteger(serialNum) && serialNum > 0) {
        saveSerialNumber(serialNum);
    }

    const category = params.get('category') || '';
    const operation = params.get('operation') || '';
    applyCategoryAndOperationFromText(category, operation);

    if (typeof updatePreview === 'function') updatePreview();
    if (modelEl && typeof autoGrowTextarea === 'function') autoGrowTextarea(modelEl);
}

function applyCategoryAndOperationFromText(category, operation) {
    const categoryType = document.getElementById('categoryType');
    const otherCategory = document.getElementById('otherCategory');
    const operationType = document.getElementById('operationType');
    const otherOperation = document.getElementById('otherOperation');

    if (categoryType) {
        let matched = false;
        for (let i = 0; i < categoryType.options.length; i++) {
            if (categoryType.options[i].value === category) {
                categoryType.value = category;
                matched = true;
                break;
            }
        }
        if (!matched && category) {
            categoryType.value = 'other';
            if (otherCategory) otherCategory.value = category;
        } else if (!category) {
            categoryType.value = '';
        }
        categoryType.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (operationType) {
        let matched = false;
        for (let i = 0; i < operationType.options.length; i++) {
            if (operationType.options[i].value === operation) {
                operationType.value = operation;
                matched = true;
                break;
            }
        }
        if (!matched && operation) {
            operationType.value = 'other';
            if (otherOperation) otherOperation.value = operation;
        } else if (!operation) {
            operationType.value = '';
        }
        operationType.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function maybeHandleNimbotAutoprintFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoprint') !== 'nimbotb1') return false;

    const backUrl = params.get('back') || getHttpsAppUrl();
    window.__nimbotReturnHttps = backUrl;
    if (params.get('paper') === 'continuous' || params.get('paper') === 'label') {
        saveNimbotPaperMode(params.get('paper'));
    }

    applyPrinterSelection('nimbotb1', { notify: false });
    fillFormFromNimbotAutoprintParams(params);
    clearUrlParams();

    const serialNumber = loadSerialNumber().toString();
    const modelNumber = document.getElementById('modelNumber').value;
    const desiredPrice = document.getElementById('desiredPrice').value;
    const purchasePrice = document.getElementById('purchasePrice').value;
    const batteryCost = document.getElementById('batteryCost').value;
    const beltCost = document.getElementById('beltCost').value;

    let category = '';
    const categoryType = document.getElementById('categoryType').value;
    const otherCategory = document.getElementById('otherCategory').value;
    if (categoryType === 'other' && otherCategory) category = otherCategory;
    else if (categoryType !== 'other') category = categoryType;

    let operation = '';
    const operationType = document.getElementById('operationType').value;
    const otherOperation = document.getElementById('otherOperation').value;
    if (operationType === 'other' && otherOperation) operation = otherOperation;
    else if (operationType !== 'other') operation = operationType;

    showMessage('NIMBOT B1へ自動印字を開始します...', 'success');
    setTimeout(function() {
        printWithNimbotB1(
            serialNumber, modelNumber, category, operation,
            purchasePrice, batteryCost, beltCost, desiredPrice,
            { skipConfirm: true, fromAutoprint: true }
        );
    }, 600);
    return true;
}

function toXSafariUrl(url) {
    if (!url) return '';
    if (/^https:\/\//i.test(url)) return 'x-safari-' + url;
    if (/^http:\/\//i.test(url)) return 'x-safari-' + url;
    return url;
}

function buildNimbotReturnPageUrl(httpsUrl) {
    const page = new URL('return.html', window.location.href);
    const webApps = buildWebAppReturnUrls();
    // return.html はショートカット優先。Safari戻りは x-safari-https を alt に渡す
    page.searchParams.set('to', webApps.primary);
    page.searchParams.set('alt', toXSafariUrl(httpsUrl || getHttpsAppUrl()));
    page.searchParams.set('sc', RETURN_SHORTCUT_NAME);
    page.searchParams.set('from', 'nimbot');
    return page.toString();
}

function showNimbotReturnOverlay(links) {
    let overlay = document.getElementById('nimbotReturnOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'nimbotReturnOverlay';
        overlay.className = 'nimbot-return-overlay';
        overlay.innerHTML =
            '<div class="nimbot-return-card">' +
            '<h2>印字完了</h2>' +
            '<p>元のWebアプリへ戻ります。自動で戻らない場合は下のボタンを押してください。</p>' +
            '<a class="nimbot-return-btn" id="nimbotReturnSafari" href="#">Safari / アプリに戻る</a>' +
            '<a class="nimbot-return-btn secondary" id="nimbotReturnShortcut" href="#">ショートカットで戻る</a>' +
            '<button type="button" class="nimbot-return-btn secondary" id="nimbotReturnClose">閉じる</button>' +
            '</div>';
        document.body.appendChild(overlay);
        document.getElementById('nimbotReturnClose').addEventListener('click', function() {
            overlay.classList.remove('is-visible');
        });
    }

    const safariBtn = document.getElementById('nimbotReturnSafari');
    const shortcutBtn = document.getElementById('nimbotReturnShortcut');
    safariBtn.href = links.safari || links.https || '#';
    shortcutBtn.href = links.shortcut || '#';
    overlay.classList.add('is-visible');
}

function returnAfterNimbotBluefyPrint() {
    const httpsUrl = window.__nimbotReturnHttps || getHttpsAppUrl();
    const safariUrl = toXSafariUrl(httpsUrl);

    showMessage('印字完了。元のアプリへ戻ります...', 'success');
    showNimbotReturnOverlay({
        safari: safariUrl,
        shortcut: getShortcutReturnUrl(),
        https: httpsUrl
    });

    // 自動戻りは1回だけ（ポップアップが増えないよう二重遷移しない）
    setTimeout(function() {
        try {
            window.location.href = safariUrl;
        } catch (e) {
            console.warn('Safari戻り失敗', e);
        }
    }, 500);
}

async function printWithNimbotB1(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice, options) {
    options = options || {};
    console.log('=== NIMBOT B1印刷開始 ===');

    // 確認ダイアログは出さない（ポップアップ過多対策）。Bluefy起動も即実行する。
    try {
        const canBlePrint = isNimbotWebBluetoothAvailable();
        const paperMode = loadNimbotPaperMode();

        if (!canBlePrint && isAppleMobileDevice() && !options.fromAutoprint) {
            const pageUrl = buildNimbotAutoprintPageUrl(
                serialNumber, modelNumber, category, operation,
                purchasePrice, batteryCost, beltCost, desiredPrice
            );
            showMessage('Bluefyを起動して自動印字します...', 'success');
            setTimeout(function() {
                openNimbotPrintInBluefy(pageUrl);
            }, 150);
            return;
        }

        if (!canBlePrint) {
            throw new Error(
                'このブラウザはBluetooth直印字に未対応です。AndroidはChrome、iPhoneはBluefyで開いてください'
            );
        }

        showMessage(
            paperMode === 'continuous'
                ? 'NIMBOT B1（58mm連続紙・試作）へ印字中...'
                : 'NIMBOT B1へ印字中...',
            'success'
        );

        let canvas;
        let model;
        let size;
        let historyExtra = { printer: 'nimbotb1', paperMode: paperMode };

        if (paperMode === 'continuous') {
            // いつもの値札レイアウトを384幅で描き、連続紙として送る
            if (typeof QRCode === 'undefined') {
                throw new Error('QRコードライブラリの読み込みに失敗しました');
            }
            const labelData = buildLabelPrintData(
                serialNumber, modelNumber, category, operation,
                purchasePrice, batteryCost, beltCost, desiredPrice
            );
            canvas = await renderThermalLabelCanvas(labelData, {
                paddingTop: 2 * 8,
                paddingBottom: 12 * 8,
                supersample: 3
            });
            if (canvas.width !== 384) {
                throw new Error('連続紙用画像幅が不正です: ' + canvas.width);
            }
            if (canvas.height > NIMBOT_B1_MAX_CONTINUOUS_HEIGHT_PX) {
                throw new Error(
                    '印字内容が長すぎます（約' + Math.round(canvas.height / 8) + 'mm）。型番を短くしてください'
                );
            }
            model = NIMBOT_B1_CONTINUOUS_MODEL;
            size = {
                label: '58mm continuous (printable 48mm)',
                w_mm: 48,
                h_mm: canvas.height / 8,
                w_px: 384,
                h_px: canvas.height,
                margin: 0,
                offset_y_px: 0,
                dpi: 203
            };
        } else {
            if (typeof JsBarcode === 'undefined') {
                throw new Error('バーコードライブラリの読み込みに失敗しました');
            }
            const barcodeRecord = createNimbotBarcodeRecord(
                serialNumber, modelNumber, category, operation,
                purchasePrice, batteryCost, beltCost, desiredPrice
            );
            saveNimbotBarcodeRecord(barcodeRecord);
            canvas = await renderNimbotB1LabelCanvas(barcodeRecord);
            model = NIMBOT_B1_MODEL;
            size = NIMBOT_B1_SIZE;
            historyExtra.barcodeId = barcodeRecord.barcodeId;
            historyExtra.barcodeValue = barcodeRecord.barcodeValue;
        }

        const pngDataUrl = canvas.toDataURL('image/png');

        await Niimbot.printImage(pngDataUrl, {
            model: model,
            size: size,
            density: 3,
            onProgress: function(status) {
                if (status && status !== 'ok' && status !== 'connecting…') {
                    showMessage('NIMBOT B1: ' + status, 'success');
                }
            }
        });

        saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice, historyExtra);
        const newSerial = parseInt(serialNumber, 10) + 1;
        saveSerialNumber(newSerial);
        updateSerialDisplay();
        updatePreview();
        showMessage(
            (paperMode === 'continuous'
                ? 'NIMBOT B1（連続紙）へ印字しました。'
                : 'NIMBOT B1へ印字しました。') +
            '連番を ' + newSerial + ' に更新しました。',
            'success'
        );

        if (options.fromAutoprint) {
            returnAfterNimbotBluefyPrint();
        }
    } catch (error) {
        console.error('=== NIMBOT B1印刷エラー ===', error);
        const msg = (error && error.message) ? error.message : String(error);
        if (/User cancelled|canceled|cancelled|NotFoundError|choos/i.test(msg)) {
            showMessage('NIMBOT B1の接続／印字がキャンセルされました', 'error');
            return;
        }
        showMessage('NIMBOT B1印刷エラー: ' + msg, 'error');
    }
}

const NIMBOT_BARCODE_STORE_KEY = 'nimbotBarcodeStore';
const NIMBOT_NOTICE_LINES = [
    '※大幅に査定金額が離れている場合は',
    'お売りする事が出来ませんのでご了承下さい。'
];

function createRandomBarcodeId() {
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += Math.floor(Math.random() * 10).toString();
    }
    return id;
}

function createNimbotBarcodeRecord(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    const barcodeId = createRandomBarcodeId();
    const record = {
        barcodeId: barcodeId,
        serialNumber: String(serialNumber || ''),
        modelNumber: modelNumber || '',
        category: category || '',
        operation: operation || '',
        purchasePrice: purchasePrice || '',
        batteryCost: batteryCost || '',
        beltCost: beltCost || '',
        desiredPrice: desiredPrice || '',
        printer: 'nimbotb1',
        printedAt: new Date().toISOString()
    };
    record.barcodeValue = buildNimbotBarcodeValue(record);
    record.displayCode = String(barcodeId).slice(-8);
    return record;
}

function buildNimbotBarcodeValue(record) {
    // CODE128は短いほど読みやすい。詰め込み可能なら本体データを入れ、長ければIDのみ。
    const packed = {
        id: record.barcodeId,
        s: record.serialNumber,
        m: String(record.modelNumber || '').slice(0, 28),
        p4: record.desiredPrice,
        pr: 'nimbotb1'
    };
    if (record.category) packed.c = String(record.category).slice(0, 12);
    if (record.operation) packed.o = String(record.operation).slice(0, 10);
    if (record.purchasePrice) packed.p1 = String(record.purchasePrice);
    if (record.batteryCost) packed.p2 = String(record.batteryCost);
    if (record.beltCost) packed.p3 = String(record.beltCost);

    try {
        const encoded = 'T1.' + bytesToBase64Url(new TextEncoder().encode(JSON.stringify(packed)));
        if (encoded.length <= 48) return encoded;
    } catch (e) {
        console.warn('バーコード埋め込みに失敗、IDのみ使用', e);
    }
    return 'N' + record.barcodeId;
}

function loadNimbotBarcodeStore() {
    try {
        const raw = localStorage.getItem(NIMBOT_BARCODE_STORE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
        return {};
    }
}

function saveNimbotBarcodeRecord(record) {
    const store = loadNimbotBarcodeStore();
    store[record.barcodeId] = record;
    store[record.barcodeValue] = record;
    // 古い順に間引き（最大200件）
    const ids = Object.keys(store).filter(function(k) {
        return store[k] && store[k].barcodeId === k;
    });
    if (ids.length > 200) {
        ids.sort(function(a, b) {
            return String(store[a].printedAt || '').localeCompare(String(store[b].printedAt || ''));
        });
        ids.slice(0, ids.length - 200).forEach(function(id) {
            const old = store[id];
            delete store[id];
            if (old && old.barcodeValue) delete store[old.barcodeValue];
        });
    }
    localStorage.setItem(NIMBOT_BARCODE_STORE_KEY, JSON.stringify(store));
}

function findNimbotBarcodeRecord(code) {
    const value = String(code || '').trim();
    if (!value) return null;
    const store = loadNimbotBarcodeStore();
    if (store[value]) return store[value];
    if (value.indexOf('N') === 0 && store[value.slice(1)]) return store[value.slice(1)];
    // 末尾8桁でも探す
    const keys = Object.keys(store);
    for (let i = 0; i < keys.length; i++) {
        const rec = store[keys[i]];
        if (!rec || !rec.barcodeId) continue;
        if (rec.barcodeId === value || rec.displayCode === value || String(rec.barcodeId).slice(-8) === value) {
            return rec;
        }
    }
    return null;
}

function decodeNimbotBarcodeValue(code) {
    const value = String(code || '').trim();
    const fromStore = findNimbotBarcodeRecord(value);
    if (fromStore) return fromStore;

    if (value.indexOf('T1.') === 0) {
        try {
            const packed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(value.slice(3))));
            if (!packed || typeof packed !== 'object') return null;
            return {
                barcodeId: packed.id || '',
                barcodeValue: value,
                displayCode: String(packed.id || '').slice(-8),
                serialNumber: packed.s != null ? String(packed.s) : '',
                modelNumber: packed.m != null ? String(packed.m) : '',
                category: packed.c != null ? String(packed.c) : '',
                operation: packed.o != null ? String(packed.o) : '',
                purchasePrice: packed.p1 != null ? String(packed.p1) : '',
                batteryCost: packed.p2 != null ? String(packed.p2) : '',
                beltCost: packed.p3 != null ? String(packed.p3) : '',
                desiredPrice: packed.p4 != null ? String(packed.p4) : '',
                printer: packed.pr != null ? String(packed.pr) : 'nimbotb1'
            };
        } catch (e) {
            return null;
        }
    }
    return null;
}

function applyNimbotBarcodeRecord(record) {
    if (!record) return false;
    applyQrPayload({
        serialNumber: record.serialNumber,
        validSerial: Number.isSafeInteger(Number(record.serialNumber)) ? Number(record.serialNumber) : null,
        modelNumber: record.modelNumber,
        category: record.category,
        operation: record.operation,
        purchasePrice: record.purchasePrice,
        batteryCost: record.batteryCost,
        beltCost: record.beltCost,
        desiredPrice: record.desiredPrice,
        printer: record.printer || 'nimbotb1'
    }, { silent: true });
    showMessage('バーコードから値札データを読み込みました', 'success');
    return true;
}

function formatNimbotPriceYen(price) {
    const num = Number(price);
    if (!Number.isFinite(num)) return '¥' + String(price || '') + '-';
    return '¥' + num.toLocaleString('ja-JP') + '-';
}

function wrapNimbotTextByWidth(ctx, text, maxWidth, fontFamily, size, weight) {
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return [];
    ctx.font = weight + ' ' + Math.round(size) + 'px ' + fontFamily;
    const chars = Array.from(raw);
    const lines = [];
    let current = '';
    for (let i = 0; i < chars.length; i++) {
        const trial = current + chars[i];
        if (current && ctx.measureText(trial).width > maxWidth) {
            lines.push(current);
            current = chars[i];
        } else {
            current = trial;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function buildNimbotModelWrap(ctx, modelNumber, maxWidth, fontFamily) {
    const sourceLines = String(modelNumber || '').split(/\n+/).map(function(s) {
        return s.trim();
    }).filter(Boolean);

    let fontSize = 14;
    let lines = [];
    for (; fontSize >= 11; fontSize--) {
        lines = [];
        sourceLines.forEach(function(src) {
            wrapNimbotTextByWidth(ctx, src, maxWidth, fontFamily, fontSize, 'bold').forEach(function(line) {
                lines.push(line);
            });
        });
        if (lines.length <= 5) break;
    }
    return { lines: lines.slice(0, 6), fontSize: fontSize };
}

function drawNimbotLeftText(ctx, text, x, y, fontFamily, size, weight) {
    if (!text) return;
    ctx.font = weight + ' ' + Math.round(size) + 'px ' + fontFamily;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if ('textRendering' in ctx) {
        ctx.textRendering = 'geometricPrecision';
    }
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    // 拡大描画前提。縁取りをやや太めにして二値化後の欠けを防ぐ
    ctx.lineWidth = size >= 18 ? 0.7 : (size >= 14 ? 0.85 : 1.0);
    const xx = Math.round(x);
    const yy = Math.round(y);
    ctx.strokeText(text, xx, yy);
    ctx.fillText(text, xx, yy);
}

function drawNimbotBarcodeToCanvas(barcodeValue, maxWidth, height) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    JsBarcode(svg, barcodeValue, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        width: 1,
        height: height,
        background: '#ffffff',
        lineColor: '#000000'
    });

    const tmp = document.createElement('canvas');
    tmp.width = maxWidth;
    tmp.height = height;
    const ctx = tmp.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, maxWidth, height);

    const xml = new XMLSerializer().serializeToString(svg);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    return new Promise(function(resolve, reject) {
        const img = new Image();
        img.onload = function() {
            const scale = Math.min(maxWidth / img.width, height / img.height);
            const w = Math.max(1, Math.floor(img.width * scale));
            const h = Math.max(1, Math.floor(img.height * scale));
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, Math.floor((maxWidth - w) / 2), Math.floor((height - h) / 2), w, h);
            // バーコードを純白黒にしてPassPRNT/Niimbotの二値化で欠けないようにする
            const image = ctx.getImageData(0, 0, maxWidth, height);
            const data = image.data;
            for (let i = 0; i < data.length; i += 4) {
                const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                const v = lum < 160 ? 0 : 255;
                data[i] = v;
                data[i + 1] = v;
                data[i + 2] = v;
                data[i + 3] = 255;
            }
            ctx.putImageData(image, 0, 0);
            resolve(tmp);
        };
        img.onerror = reject;
        img.src = url;
    });
}

// 添付レイアウト: T's time / 8桁 / 商品行 / ¥金額- / 注意文 / CODE128
// 文字は拡大描画→ドット化してから渡す（グレー縁が二値化で潰れるのを防ぐ）
async function renderNimbotB1LabelCanvas(record) {
    await ensurePrintFontReady();

    const widthPx = NIMBOT_B1_SIZE.w_px;
    const heightPx = NIMBOT_B1_SIZE.h_px;
    const marginX = 10;
    const marginY = 6;
    const contentWidth = widthPx - marginX * 2;
    const fontFamily = MPB20_FONT_FAMILY;
    const noticeSize = 14;
    const noticeLine = 17;
    const barcodeHeightTarget = 38;
    const priceSizeBase = 26;
    const headerBlock = 22;
    const productTop = marginY + headerBlock;
    const supersample = 3;

    const hiCanvas = document.createElement('canvas');
    hiCanvas.width = widthPx * supersample;
    hiCanvas.height = heightPx * supersample;
    const hiCtx = hiCanvas.getContext('2d', { willReadFrequently: true });
    hiCtx.fillStyle = '#ffffff';
    hiCtx.fillRect(0, 0, hiCanvas.width, hiCanvas.height);
    hiCtx.setTransform(supersample, 0, 0, supersample, 0, 0);
    hiCtx.fillStyle = '#000000';
    hiCtx.textBaseline = 'top';

    // 上段: 左 T's time / 右 8桁
    drawNimbotLeftText(hiCtx, "T's time", marginX, marginY, MPB20_HEADER_FONT_FAMILY, 18, 'bold');
    hiCtx.font = 'bold 18px ' + fontFamily;
    hiCtx.textAlign = 'right';
    hiCtx.textBaseline = 'top';
    hiCtx.lineJoin = 'round';
    hiCtx.lineWidth = 0.85;
    hiCtx.strokeStyle = '#000';
    hiCtx.fillStyle = '#000';
    hiCtx.strokeText(String(record.displayCode || '00000000'), widthPx - marginX, marginY);
    hiCtx.fillText(String(record.displayCode || '00000000'), widthPx - marginX, marginY);

    const priceBlock = priceSizeBase + 8;
    const noticeBlock = noticeLine * NIMBOT_NOTICE_LINES.length + 4;
    const reservedBottom = priceBlock + noticeBlock + barcodeHeightTarget + marginY + 6;
    const productAreaHeight = Math.max(18, heightPx - productTop - reservedBottom);

    // 計測は等倍コンテキストで行う
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    const modelWrap = buildNimbotModelWrap(measureCtx, record.modelNumber, contentWidth, fontFamily);
    const productLines = [];
    if (record.category) {
        productLines.push({ text: String(record.category), size: Math.max(13, modelWrap.fontSize) });
    }
    modelWrap.lines.forEach(function(line) {
        productLines.push({ text: line, size: Math.max(12, modelWrap.fontSize) });
    });
    if (record.operation && modelWrap.lines.length <= 2) {
        productLines.push({ text: String(record.operation), size: 13 });
    }

    let lineStep = Math.max(16, modelWrap.fontSize + 4);
    let maxProductLines = Math.max(1, Math.floor(productAreaHeight / lineStep));
    if (productLines.length > maxProductLines && productLines.length > 0) {
        lineStep = Math.max(14, Math.floor(productAreaHeight / Math.min(productLines.length, 6)));
        maxProductLines = Math.max(1, Math.floor(productAreaHeight / lineStep));
    }

    let y = productTop;
    const drawnProductCount = Math.min(productLines.length, maxProductLines);
    for (let i = 0; i < drawnProductCount; i++) {
        drawNimbotLeftText(hiCtx, productLines[i].text, marginX, y, fontFamily, productLines[i].size, 'bold');
        y += lineStep;
    }

    y += 3;
    const priceText = formatNimbotPriceYen(record.desiredPrice);
    let priceSize = priceSizeBase;
    measureCtx.font = 'bold ' + priceSize + 'px ' + fontFamily;
    while (priceSize > 16 && measureCtx.measureText(priceText).width > contentWidth) {
        priceSize -= 1;
        measureCtx.font = 'bold ' + priceSize + 'px ' + fontFamily;
    }
    const minNeedAfterPrice = noticeBlock + 34 + marginY;
    if (y + priceSize + 6 + minNeedAfterPrice > heightPx) {
        const allowed = heightPx - minNeedAfterPrice - y - 6;
        if (allowed >= 16) priceSize = Math.min(priceSize, allowed);
    }
    drawNimbotLeftText(hiCtx, priceText, marginX, y, fontFamily, priceSize, 'bold');
    y += priceSize + 6;

    // 注意文はBold+縁取りで潰れにくくする
    let noticeFont = noticeSize;
    measureCtx.font = 'bold ' + noticeFont + 'px ' + MPB20_FONT_REGULAR_FAMILY;
    NIMBOT_NOTICE_LINES.forEach(function(line) {
        while (noticeFont > 12 && measureCtx.measureText(line).width > contentWidth) {
            noticeFont -= 1;
            measureCtx.font = 'bold ' + noticeFont + 'px ' + MPB20_FONT_REGULAR_FAMILY;
        }
    });
    const noticeStep = Math.max(16, noticeFont + 3);
    NIMBOT_NOTICE_LINES.forEach(function(line) {
        drawNimbotLeftText(hiCtx, line, marginX, y, MPB20_FONT_REGULAR_FAMILY, noticeFont, 'bold');
        y += noticeStep;
    });

    y += 3;
    const barcodeTop = Math.max(y, Math.min(y, heightPx - marginY - 30));
    const barcodeHeight = Math.max(30, heightPx - barcodeTop - marginY);

    // 文字だけドット化（バーコードは後から等倍で重ねる）
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = widthPx;
    outputCanvas.height = heightPx;
    const outputCtx = outputCanvas.getContext('2d');
    const outputImage = outputCtx.createImageData(widthPx, heightPx);
    reduceBandToDots(hiCtx, supersample, 0, widthPx, heightPx, outputImage, 0);
    outputCtx.putImageData(outputImage, 0, 0);

    const barcodeCanvas = await drawNimbotBarcodeToCanvas(record.barcodeValue, contentWidth, barcodeHeight);
    outputCtx.imageSmoothingEnabled = false;
    outputCtx.drawImage(barcodeCanvas, marginX, barcodeTop, contentWidth, barcodeHeight);

    await waitForNextFrame();
    return outputCanvas;
}

function waitForNextFrame() {
    return new Promise(function(resolve) {
        requestAnimationFrame(function() {
            requestAnimationFrame(resolve);
        });
    });
}

// QRのセル配置だけを取り出す（ライブラリの描画は使わない）
function buildQRModules(text) {
    const host = document.getElementById('qrcodeTemp');
    if (!host) throw new Error('QRコード生成領域がありません');

    host.innerHTML = '';
    const qr = new QRCode(host, {
        text: text,
        width: 64,
        height: 64,
        correctLevel: QRCode.CorrectLevel.M
    });

    const model = qr._oQRCode;
    const count = model.getModuleCount();
    const modules = [];
    for (let row = 0; row < count; row++) {
        const cells = [];
        for (let col = 0; col < count; col++) {
            cells.push(model.isDark(row, col) === true);
        }
        modules.push(cells);
    }

    host.innerHTML = '';
    return { count: count, modules: modules };
}

// 1セルを印字ドットの整数個で自前に描く。
// ライブラリ任せの拡大縮小だとセルの境界がドットの境界とずれ、
// 白黒に落とす際に太いセルと細いセルが混ざって読み取れなくなる
function createPrintableQRCode(text, maxSizePx) {
    const qr = buildQRModules(text);
    const quietCells = 4; // 読み取りに必要な静止領域
    const totalCells = qr.count + quietCells * 2;

    let cellDots = 3;
    while (cellDots > 1 && totalCells * cellDots > maxSizePx) {
        cellDots -= 1;
    }

    const size = totalCells * cellDots;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (let row = 0; row < qr.count; row++) {
        for (let col = 0; col < qr.count; col++) {
            if (qr.modules[row][col]) {
                ctx.fillRect((col + quietCells) * cellDots, (row + quietCells) * cellDots, cellDots, cellDots);
            }
        }
    }

    return { canvas: canvas, size: size, moduleCount: qr.count, cellDots: cellDots };
}

function drawCenteredLine(ctx, text, centerX, y) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    // サブピクセル配置だと二値化後に輪郭ががたつくので整数座標へ揃える
    if ('textRendering' in ctx) {
        ctx.textRendering = 'geometricPrecision';
    }
    ctx.fillText(text, Math.round(centerX), Math.round(y));
}

// 濁点（ご・ざ 等）の細い部品が二値化で欠けないよう、
// ごく薄い縁取りのあと塗りつぶして輪郭を安定させる
function drawStablePrintLine(ctx, text, centerX, y, maxWidth, fontFamily, size, weight) {
    let fontSize = size;
    applyMpb20Font(ctx, fontFamily, fontSize, weight);
    while (fontSize > 12 && ctx.measureText(text).width > maxWidth) {
        fontSize -= 1;
        applyMpb20Font(ctx, fontFamily, fontSize, weight);
    }

    const x = Math.round(centerX);
    const yy = Math.round(y);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if ('textRendering' in ctx) {
        ctx.textRendering = 'geometricPrecision';
    }
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    // 論理座標0.4px ≈ 拡大描画時に1ドット強。見た目の太さはほとんど変えず欠けだけ防ぐ
    ctx.lineWidth = 0.4;
    ctx.strokeText(text, x, yy);
    ctx.fillText(text, x, yy);
}

function applyMpb20Font(ctx, fontFamily, size, weight) {
    // サイズも整数化して、拡大描画時の画線がドット境界に乗りやすくする
    ctx.font = `${weight} ${Math.round(size)}px ${fontFamily}`;
}

// 拡大して描いた帯を印字ドットへ落とす。
// ブラウザ任せの縮小は端末ごとに補間が違い、にじみ方が揃わずに印字ががたつくため、
// ドット1つ分の面積をそのまま平均して黒か白かを決める
// 濃いめに倒すと画数の多い漢字の隙間が埋まり、サーマルのにじみと合わさって潰れる。
// ドットの半分以上が掛かったところだけ黒にする
const MPB20_INK_THRESHOLD = 140;

function reduceBandToDots(bandCtx, supersample, sourceTop, widthPx, height, outputImage, outputTop) {
    const sourceWidth = widthPx * supersample;
    const source = bandCtx.getImageData(0, sourceTop, sourceWidth, height * supersample).data;
    const output = outputImage.data;
    const samples = supersample * supersample;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < widthPx; x++) {
            let total = 0;
            for (let dy = 0; dy < supersample; dy++) {
                const rowStart = (y * supersample + dy) * sourceWidth + x * supersample;
                for (let dx = 0; dx < supersample; dx++) {
                    const i = (rowStart + dx) * 4;
                    total += source[i] * 0.299 + source[i + 1] * 0.587 + source[i + 2] * 0.114;
                }
            }

            const value = (total / samples) < MPB20_INK_THRESHOLD ? 0 : 255;
            const target = ((outputTop + y) * widthPx + x) * 4;
            output[target] = value;
            output[target + 1] = value;
            output[target + 2] = value;
            output[target + 3] = 255;
        }
    }
}

// 印字幅を超える行はフォントを縮めて必ず収める
function drawFittedLine(ctx, text, centerX, y, maxWidth, fontFamily, size, weight) {
    let fontSize = size;
    applyMpb20Font(ctx, fontFamily, fontSize, weight);
    while (fontSize > 12 && ctx.measureText(text).width > maxWidth) {
        fontSize -= 1;
        applyMpb20Font(ctx, fontFamily, fontSize, weight);
    }
    drawCenteredLine(ctx, text, centerX, y);
}

// 外部CDNではなく同梱した公式TTFを固有名で登録する。
// 固有名にすることで、読み込み失敗時に端末内の別フォントへ黙って置き換わるのを防ぐ
const MPB20_FONT_NAME = 'TstimeBIZUDGothic';
const MPB20_FONT_REGULAR_NAME = 'TstimeBIZUDGothicRegular';
const MPB20_FONT_FAMILY = `"${MPB20_FONT_NAME}"`;
const MPB20_FONT_REGULAR_FAMILY = `"${MPB20_FONT_REGULAR_NAME}"`;
let mpb20FontLoadPromise = null;
let mpb20FontFace = null;
let mpb20RegularFontFace = null;

// 「T❜s time」の行だけは見た目を変えたくないので、従来のフォントで描く
const MPB20_HEADER_FONT_FAMILY = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';

// 印刷時に待たせたくないので先読みする（MP-B20・TM系とも画像印字で使用）
function preloadMpb20FontIfSelected() {
    ensurePrintFontReady().catch(function(error) {
        console.warn('BIZ UDゴシックの先読み失敗', error);
    });
}

function isMpb20FontFaceReady(face) {
    return !!(face && face.status === 'loaded' && document.fonts.has(face));
}

async function ensurePrintFontReady() {
    if (!document.fonts || typeof FontFace === 'undefined') {
        throw new Error('この端末では印字フォントを読み込めません');
    }

    if (isMpb20FontFaceReady(mpb20FontFace) && isMpb20FontFaceReady(mpb20RegularFontFace)) {
        return;
    }

    if (!mpb20FontLoadPromise) {
        mpb20FontLoadPromise = (async function() {
            const boldUrl = new URL('fonts/BIZUDGothic-Bold.ttf', document.baseURI).href;
            const regularUrl = new URL('fonts/BIZUDGothic-Regular.ttf', document.baseURI).href;

            mpb20FontFace = new FontFace(
                MPB20_FONT_NAME,
                `url("${boldUrl}") format("truetype")`,
                { style: 'normal', weight: '700' }
            );
            mpb20RegularFontFace = new FontFace(
                MPB20_FONT_REGULAR_NAME,
                `url("${regularUrl}") format("truetype")`,
                { style: 'normal', weight: '400' }
            );

            await Promise.all([mpb20FontFace.load(), mpb20RegularFontFace.load()]);
            document.fonts.add(mpb20FontFace);
            document.fonts.add(mpb20RegularFontFace);
            await document.fonts.ready;

            if (!isMpb20FontFaceReady(mpb20FontFace) || !isMpb20FontFaceReady(mpb20RegularFontFace)) {
                throw new Error('BIZ UDゴシックの読み込みを確認できませんでした');
            }
        })().catch(function(error) {
            // 一時的な通信・キャッシュ不良なら印刷ボタン押下時に再試行できるようにする
            mpb20FontLoadPromise = null;
            mpb20FontFace = null;
            mpb20RegularFontFace = null;
            throw error;
        });
    }

    try {
        await mpb20FontLoadPromise;
        await document.fonts.ready;
    } catch (error) {
        throw new Error('BIZ UDゴシックを読み込めませんでした。再読み込み後にお試しください');
    }
}

// 58mmサーマル共通の値札キャンバス（BIZ UDゴシック）。
// TM-P20IIなど内蔵フォントが独特な機種でも、画像印字なら同じ綺麗な字形になる
async function renderThermalLabelCanvas(labelData, options) {
    options = options || {};
    await ensurePrintFontReady();

    // 203dpi（8ドット/mm）。58mm用紙の実印字幅48mmに1:1で合わせる
    const pxPerMm = 8;
    const widthMm = 48;
    const widthPx = widthMm * pxPerMm; // 384
    const contentWidthPx = widthPx - 16;
    const centerX = widthPx / 2;
    const blockGapPx = 2 * pxPerMm; // 連番・カテゴリー・型番の間隔2mm
    // 用紙を節約するため上端まで詰める。文字は上端が基準なので0でも欠けない
    const paddingTop = options.paddingTop != null ? options.paddingTop : 0;
    // MP-B20は排紙距離があるので余白多め。TM系はカットがあるので短くてよい
    const paddingBottom = options.paddingBottom != null ? options.paddingBottom : (14 * pxPerMm);
    const fontFamily = MPB20_FONT_FAMILY;
    // 型番が長いほどQRのセル数が増えるので、大きさは1セル3ドットを保てるよう可変にする
    const qr = createPrintableQRCode(labelData.dataURL, contentWidthPx);
    const qrSize = qr.size;

    const fonts = {
        header: { size: 34, weight: 'bold', line: 42 },
        body: { size: 26, weight: 'bold', line: 34 },
        price: { size: 24, weight: 'bold', line: 32 },
        desired: { size: 50, weight: 'bold', line: 58 },
        notice: { size: 28, weight: 'normal', line: 36 },
        footer: { size: 24, weight: 'normal', line: 30 }
    };

    let yEstimate = paddingTop + fonts.header.line + blockGapPx;
    if (labelData.category) yEstimate += fonts.body.line + blockGapPx;
    yEstimate += labelData.modelLines.length * fonts.body.line + 14;
    yEstimate += labelData.operationLines.length * fonts.body.line;
    if (labelData.operationLines.length) yEstimate += 14;
    yEstimate += labelData.priceLines.length * fonts.price.line;
    if (labelData.priceLines.length) yEstimate += 14;
    yEstimate += fonts.desired.line;
    if (labelData.printNotice) yEstimate += labelData.noticeLines.length * fonts.notice.line + 14;
    // 日付の下に2mm空けてから点線、その後QR
    const dateToDotGapPx = 2 * pxPerMm;
    const dottedBlockPx = 12;
    yEstimate += fonts.footer.line + dateToDotGapPx + dottedBlockPx + qrSize + 10 + fonts.footer.line + paddingBottom;

    const finalHeight = Math.ceil(yEstimate);

    const drawDottedSeparator = function(ctx, cx, lineY, width) {
        const left = Math.round(cx - width / 2);
        const yPos = Math.round(lineY);
        const dot = 4;
        const gap = 3;
        ctx.fillStyle = '#000';
        for (let x = left; x + dot <= left + width; x += dot + gap) {
            // 少し太くして印字で薄く見えないようにする
            ctx.fillRect(x, yPos, dot, 3);
        }
    };

    const drawLabel = function(ctx) {
        let y = paddingTop;

        drawFittedLine(ctx, labelData.headerLine, centerX, y, contentWidthPx, MPB20_HEADER_FONT_FAMILY, fonts.header.size, fonts.header.weight);
        y += fonts.header.line + blockGapPx;

        if (labelData.category) {
            drawFittedLine(ctx, labelData.category, centerX, y, contentWidthPx, fontFamily, fonts.body.size, fonts.body.weight);
            y += fonts.body.line + blockGapPx;
        }

        labelData.modelLines.forEach(function(line) {
            drawFittedLine(ctx, line, centerX, y, contentWidthPx, fontFamily, fonts.body.size, fonts.body.weight);
            y += fonts.body.line;
        });
        y += 14;

        labelData.operationLines.forEach(function(line) {
            drawFittedLine(ctx, line, centerX, y, contentWidthPx, fontFamily, fonts.body.size, fonts.body.weight);
            y += fonts.body.line;
        });
        if (labelData.operationLines.length) {
            y += 14;
        }

        labelData.priceLines.forEach(function(line) {
            drawFittedLine(ctx, line, centerX, y, contentWidthPx, fontFamily, fonts.price.size, fonts.price.weight);
            y += fonts.price.line;
        });
        if (labelData.priceLines.length) {
            y += 14;
        }

        drawFittedLine(ctx, labelData.desiredLine, centerX, y, contentWidthPx, fontFamily, fonts.desired.size, fonts.desired.weight);
        y += fonts.desired.line;

        if (labelData.printNotice) {
            labelData.noticeLines.forEach(function(line) {
                // Bold+縁取りは「承」など画数の多い字の隙間を埋めて潰す。
                // Regularをやや大きめにし、濁点はサイズで稼ぎつつ字の中を残す
                drawFittedLine(
                    ctx,
                    line,
                    centerX,
                    Math.round(y),
                    contentWidthPx,
                    MPB20_FONT_REGULAR_FAMILY,
                    fonts.notice.size,
                    fonts.notice.weight
                );
                y += fonts.notice.line;
            });
            y += 14;
        }

        // 日付は小さいBoldだとがたつくので、印字用Regularをやや大きめに使う
        drawFittedLine(
            ctx,
            labelData.dateString,
            centerX,
            Math.round(y),
            contentWidthPx,
            MPB20_FONT_REGULAR_FAMILY,
            fonts.footer.size,
            fonts.footer.weight
        );
        y += fonts.footer.line;

        // 日付と点線の間に2mm空ける
        y += dateToDotGapPx;
        drawDottedSeparator(ctx, centerX, y, contentWidthPx);
        y += dottedBlockPx;

        // 補間するとセルの境界がドット境界からずれるため、拡大は等倍コピーで行う
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qr.canvas, Math.round(centerX - qrSize / 2), Math.round(y), qrSize, qrSize);
        ctx.imageSmoothingEnabled = true;
        y += qrSize + 10;

        drawFittedLine(
            ctx,
            labelData.qrcodeNumber,
            centerX,
            Math.round(y),
            contentWidthPx,
            MPB20_FONT_REGULAR_FAMILY,
            fonts.footer.size,
            fonts.footer.weight
        );
    };

    const drawBottomAnchorMarks = function(ctx, canvasWidth, canvasHeight) {
        // PassPRNTは末尾の白ラスターを飛ばすことがある。余白を確実に印字する目印
        const y = canvasHeight - 1;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, y, 2, 1);
        ctx.fillRect(canvasWidth - 2, y, 2, 1);
    };

    // 印字ドットと等倍で文字を描くと画線が1ドット未満になって掠れるため、
    // 拡大して描いてから等倍へ縮小し、そのうえでドットを判定する。
    // 型番が長いと拡大後の高さが端末のキャンバス上限を超えて下部が欠けるので、
    // 横帯に区切って描き、帯ごとに縮小して貼り合わせる
    const supersample = options.supersample != null ? options.supersample : 3;
    const bandHeight = 400;
    const bandMargin = 16;

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = widthPx;
    outputCanvas.height = finalHeight;
    const outputCtx = outputCanvas.getContext('2d');
    const outputImage = outputCtx.createImageData(widthPx, finalHeight);

    const band = document.createElement('canvas');
    band.width = widthPx * supersample;
    band.height = (bandHeight + bandMargin * 2) * supersample;
    const bandCtx = band.getContext('2d', { willReadFrequently: true });

    for (let top = 0; top < finalHeight; top += bandHeight) {
        const height = Math.min(bandHeight, finalHeight - top);

        bandCtx.setTransform(1, 0, 0, 1, 0, 0);
        bandCtx.fillStyle = '#ffffff';
        bandCtx.fillRect(0, 0, band.width, band.height);
        // 帯の境目で文字が欠けないよう、上下に余白分を含めて描いてから切り出す
        bandCtx.setTransform(supersample, 0, 0, supersample, 0, -(top - bandMargin) * supersample);
        bandCtx.fillStyle = '#000000';
        drawLabel(bandCtx);

        reduceBandToDots(bandCtx, supersample, bandMargin * supersample, widthPx, height, outputImage, top);
    }

    outputCtx.putImageData(outputImage, 0, 0);
    if (options.anchorBottomMargin) {
        drawBottomAnchorMarks(outputCtx, widthPx, finalHeight);
    }
    await waitForNextFrame();
    return outputCanvas;
}

async function createThermalLabelPdf(labelData, options) {
    options = options || {};
    const paddingBottom = options.paddingBottom != null ? options.paddingBottom : (14 * 8);
    const paddingTop = options.paddingTop != null ? options.paddingTop : 0;
    const outputCanvas = await renderThermalLabelCanvas(labelData, {
        paddingBottom: paddingBottom,
        paddingTop: paddingTop,
        anchorBottomMargin: options.anchorBottomMargin === true
    });
    const widthMm = 48;
    const imgData = outputCanvas.toDataURL('image/png');
    const heightMm = widthMm * (outputCanvas.height / outputCanvas.width);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [widthMm, heightMm],
        compress: true
    });
    // URLスキームで渡すため、可逆圧縮でデータ量を抑える
    pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'SLOW');
    return pdf.output('datauristring').split(',')[1];
}

async function createMPB20LabelPdf(labelData) {
    // MP-B20はサーマルヘッドから紙排出口まで距離があり、印字直後はその分が本体内に残る。
    // URL Print Agentに追加フィードを指示する手段が無いため、末尾の余白で押し出す
    return createThermalLabelPdf(labelData, { paddingBottom: 14 * 8 });
}

async function createSms210iLabelPdf(labelData) {
    // MP-B20と同じ14mm下部余白。Star/PassPRNTは末尾の白を飛ばすことがあるので目印を付ける
    return createThermalLabelPdf(labelData, {
        paddingTop: 2 * 8,
        paddingBottom: 14 * 8,
        anchorBottomMargin: true
    });
}

// Uint8ArrayをBase64へ（大きな配列でもスタックを食いすぎない）
function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        const slice = bytes.subarray(i, Math.min(i + chunk, bytes.length));
        binary += String.fromCharCode.apply(null, slice);
    }
    return btoa(binary);
}

// キャンバスをePOS-Print用の1bitラスタ（横8ドット単位）へ変換する
function canvasToEposMonoRaster(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    const paddedWidth = Math.ceil(width / 8) * 8;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const rowBytes = paddedWidth / 8;
    const bytes = new Uint8Array(rowBytes * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < paddedWidth; x++) {
            let black = false;
            if (x < width) {
                const i = (y * width + x) * 4;
                const lum = imageData[i] * 0.299 + imageData[i + 1] * 0.587 + imageData[i + 2] * 0.114;
                black = lum < 160;
            }
            if (black) {
                bytes[y * rowBytes + (x >> 3)] |= (0x80 >> (x & 7));
            }
        }
    }

    return {
        width: paddedWidth,
        height: height,
        rowBytes: rowBytes,
        bytes: bytes,
        data: bytesToBase64(bytes)
    };
}

// TM Print Assistant / TM Assistant向け：綺麗なBIZ UD字形を画像として送る。
// 1枚の巨大画像だとTM-P20II側のバッファで下部が途切れやすいので、
// 横帯に分けて連続送信し、最後に紙送りしてからカットする
function buildEposRasterPrintXml(raster, options) {
    options = options || {};
    // 帯の高さは8の倍数。小さすぎるとXMLが冗長、大きすぎるとバッファ溢れ
    const bandHeight = options.bandHeight != null ? options.bandHeight : 192;
    // 管理番号の下を確実に排紙口まで出す（ドット単位。8ドット=1mm）
    const bottomFeedUnits = options.bottomFeedUnits != null ? options.bottomFeedUnits : 64;

    let xml = '<?xml version="1.0" encoding="utf-8"?>';
    xml += '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">';
    xml += '<text align="left"/>';

    const rowBytes = raster.rowBytes || (raster.width / 8);
    const bytes = raster.bytes;
    if (!bytes) {
        xml += '<image width="' + raster.width + '" height="' + raster.height + '" color="color_1" mode="mono">';
        xml += raster.data;
        xml += '</image>';
    } else {
        for (let y = 0; y < raster.height; y += bandHeight) {
            const h = Math.min(bandHeight, raster.height - y);
            const slice = bytes.subarray(y * rowBytes, (y + h) * rowBytes);
            xml += '<image width="' + raster.width + '" height="' + h + '" color="color_1" mode="mono">';
            xml += bytesToBase64(slice);
            xml += '</image>';
        }
    }

    xml += '<feed unit="' + bottomFeedUnits + '"/>';
    xml += '<cut type="feed"/>';
    xml += '</epos-print>';
    return xml;
}

async function buildTmRasterPrintXml(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    if (typeof QRCode === 'undefined') {
        throw new Error('QRコードライブラリの読み込みに失敗しました');
    }
    const labelData = buildLabelPrintData(
        serialNumber, modelNumber, category, operation,
        purchasePrice, batteryCost, beltCost, desiredPrice
    );
    // 下部が切れないよう管理番号下に十分な余白。データ量は倍率2で抑える
    const canvas = await renderThermalLabelCanvas(labelData, {
        paddingBottom: 10 * 8,
        supersample: 2
    });
    const raster = canvasToEposMonoRaster(canvas);
    const xml = buildEposRasterPrintXml(raster, {
        bandHeight: 192,
        bottomFeedUnits: 64
    });
    return { xml: xml, raster: raster, labelData: labelData };
}

// XML特殊文字エスケープ
function escapeXml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
}

// 半角を1、全角を2として行の幅を数える（58mm用紙は1行あたり半角32文字）
const PRINT_LINE_UNITS = 32;

// 入力欄の字送りを詰める際の基準。全角が最も広いので、
// 全角16文字（=半角32文字分）が収まれば他の組み合わせも収まる
const MODEL_LINE_CHARS = PRINT_LINE_UNITS / 2;

function textWidthUnits(text) {
    let units = 0;
    for (const ch of text) {
        const code = ch.codePointAt(0);
        const halfWidth = (code >= 0x20 && code <= 0x7e) || (code >= 0xff61 && code <= 0xff9f);
        units += halfWidth ? 1 : 2;
    }
    return units;
}

// 印字幅で折り返す。文字数で数えると、半角だけの型番が行の半分で改行され、
// 全角混在の型番は逆に用紙幅を超えてしまう
function splitTextByWidth(text, maxUnits) {
    if (!text) return [''];

    const lines = [];
    let line = '';
    let units = 0;

    for (const ch of text) {
        const chUnits = textWidthUnits(ch);
        if (units + chUnits > maxUnits && line !== '') {
            lines.push(line);
            line = '';
            units = 0;
        }
        line += ch;
        units += chUnits;
    }
    lines.push(line);

    return lines;
}

// 稼働方式は「稼働」「未稼働」の括弧の前で折り返す。
// 文字数だけで切ると「キネティック(自動巻発電式ｸｫｰﾂ」「)「稼働」」のように
// 閉じ括弧が行頭へ落ちて読みにくくなる
function splitOperationText(text) {
    if (textWidthUnits(text) <= PRINT_LINE_UNITS) return [text];

    const bracket = text.indexOf('「');
    if (bracket > 0) {
        const head = text.slice(0, bracket);
        const tail = text.slice(bracket);
        if (textWidthUnits(head) <= PRINT_LINE_UNITS && textWidthUnits(tail) <= PRINT_LINE_UNITS) {
            return [head, tail];
        }
    }

    return splitTextByWidth(text, PRINT_LINE_UNITS);
}

// テキストエリアの自動改行処理
function autoLineBreak(textarea, maxCharsPerLine) {
    const cursorPos = textarea.selectionStart;
    let text = textarea.value.replace(/\n/g, ''); // 既存の改行を削除

    let formatted = '';
    for (let i = 0; i < text.length; i += maxCharsPerLine) {
        if (i > 0) formatted += '\n';
        formatted += text.substring(i, i + maxCharsPerLine);
    }
    
    textarea.value = formatted;
    
    // カーソル位置を調整
    const newCursorPos = Math.min(cursorPos, formatted.length);
    textarea.setSelectionRange(newCursorPos, newCursorPos);
}

// 貼り付け時の自動改行処理（手動改行を保持しながら超過行を分割）
function autoLineBreakForPaste(textarea, maxUnitsPerLine) {
    const formatted = textarea.value.split('\n').flatMap(function(line) {
        return textWidthUnits(line) > maxUnitsPerLine
            ? splitTextByWidth(line, maxUnitsPerLine)
            : [line];
    });

    textarea.value = formatted.join('\n');
}

// 手動改行を残したまま印字幅で折り返し、カーソルの移動先も同時に求める。
// 型番は入力どおりに印字するので、半角1・全角2で数えた実際の印字幅が上限になる。
// 文字数で数えると半角の型番が行の半分で切れてしまう。
// 折り返しの前後で文字の並びは変わらないので、元の文字を1つずつ書き写しながら
// カーソルが何文字目にあったかを追いかければ、挿入した改行の分だけ正確にずれる
function wrapWithCursor(value, maxUnitsPerLine, cursorPos) {
    const lines = value.split('\n');
    let out = '';
    let readCount = 0;
    let cursor = null;

    for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
            if (readCount === cursorPos && cursor === null) cursor = out.length;
            out += '\n';
            readCount++;
        }

        let units = 0;
        // サロゲートペアを壊さないよう、コードポイント単位で走査する
        for (const ch of lines[i]) {
            const chUnits = textWidthUnits(ch);
            if (units > 0 && units + chUnits > maxUnitsPerLine) {
                out += '\n';
                units = 0;
            }
            if (readCount === cursorPos && cursor === null) cursor = out.length;
            out += ch;
            units += chUnits;
            readCount += ch.length;
        }
    }

    return { value: out, cursor: cursor === null ? out.length : cursor };
}

// スマートな自動改行（手動改行を保持しつつ、印字幅の超過分を自動分割）
function autoLineBreakSmart(textarea, maxUnitsPerLine) {
    const wrapped = wrapWithCursor(textarea.value, maxUnitsPerLine, textarea.selectionStart);
    if (wrapped.value === textarea.value) return;

    textarea.value = wrapped.value;
    textarea.setSelectionRange(wrapped.cursor, wrapped.cursor);
}

// 半角数字を全角数字に変換
function toFullWidth(str) {
    return str.replace(/[0-9]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
}

function formatPriceFullWidth(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return toFullWidth('0');
    return toFullWidth(String(Math.max(0, Math.trunc(n))));
}

function formatSerialDigits5FullWidth(serialNumber) {
    return toFullWidth(String(serialNumber).padStart(5, '0'));
}

function formatDateJPFullWidth(dateObj) {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // no leading zero (example)
    const day = dateObj.getDate(); // no leading zero (example)
    return `${toFullWidth(String(year))}年　${toFullWidth(String(month))}月　${toFullWidth(String(day))}日`;
}

function formatYMDDigits(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

function buildQrcodeNumberFullWidth(dateObj, serialNumber) {
    const ymd = formatYMDDigits(dateObj);
    const serial = String(serialNumber).padStart(5, '0');
    return toFullWidth(ymd + serial);
}

function buildPriceLine(label, value) {
    return `${label}${formatPriceFullWidth(value)}円`;
}

// Bluetooth接続で印刷
function printViaBluetooth(serialNumber, modelNumber, purchasePrice, batteryCost, beltCost, desiredPrice, printerBT) {
    showMessage('Bluetoothプリンターに接続中...', 'success');
    
    try {
        const eposDevice = new epson.ePOSDevice();
        
        // Bluetoothアドレスの形式変換（複数の形式を試す）
        let btAddress = printerBT.trim();
        
        // すでにBT:で始まっていない場合、追加
        if (!btAddress.startsWith('BT:')) {
            // コロンを削除して大文字に変換
            btAddress = 'BT:' + printerBT.replace(/:/g, '').replace(/-/g, '').toUpperCase();
        }
        
        console.log('接続先Bluetoothアドレス:', btAddress);
        console.log('元のアドレス:', printerBT);
        
        // タイムアウト設定
        eposDevice.timeout = 30000; // 30秒
        
        // Bluetooth接続（ePOS-Print SDKのBluetooth接続は空文字列またはundefinedをポート番号に使用）
        eposDevice.connect(btAddress, undefined, function(data) {
            console.log('Bluetooth接続結果:', data);
            
            if (data === 'OK' || data === 'SSL_CONNECT_OK') {
                showMessage('プリンターに接続しました。印刷データ送信中...', 'success');
                executePrint(eposDevice, serialNumber, modelNumber, purchasePrice, batteryCost, beltCost, desiredPrice);
            } else if (data === 'ERROR_TIMEOUT') {
                showMessage('Bluetooth接続タイムアウト。プリンターの電源とペアリングを確認してください。', 'error');
                console.error('タイムアウト: プリンターが見つからないか、応答していません');
                // 別の形式で再試行
                retryBluetoothConnection(eposDevice, printerBT, serialNumber, modelNumber, purchasePrice, batteryCost, beltCost, desiredPrice);
            } else {
                showMessage('Bluetoothプリンターに接続できません。エラー: ' + data, 'error');
                console.error('Bluetooth接続エラー:', data);
            }
        });
        
        // 再接続イベント
        eposDevice.onreconnecting = function() {
            console.log('プリンターへ再接続中...');
            showMessage('プリンターへ再接続中...', 'success');
        };
        
        eposDevice.onreconnect = function() {
            console.log('プリンターへ再接続しました');
            showMessage('プリンターへ再接続しました', 'success');
        };
        
        eposDevice.ondisconnect = function() {
            console.log('プリンターから切断されました');
        };
        
    } catch (error) {
        console.error('Bluetooth印刷エラー:', error);
        showMessage('Bluetooth印刷エラー: ' + error.message, 'error');
    }
}

// Bluetooth再接続試行
function retryBluetoothConnection(eposDevice, printerBT, serialNumber, modelNumber, purchasePrice, batteryCost, beltCost, desiredPrice) {
    console.log('別の形式でBluetooth接続を再試行します...');
    showMessage('別の方法で接続を試行中...', 'success');
    
    // 単純にアドレスのみで接続を試す
    const simpleAddress = printerBT.replace(/:/g, '').replace(/-/g, '').toUpperCase();
    
    eposDevice.disconnect();
    
    setTimeout(function() {
        const newDevice = new epson.ePOSDevice();
        newDevice.timeout = 30000;
        
        newDevice.connect(simpleAddress, undefined, function(data) {
            console.log('再試行結果（アドレスのみ）:', data, 'アドレス:', simpleAddress);
            if (data === 'OK' || data === 'SSL_CONNECT_OK') {
                showMessage('プリンターに接続しました（再試行成功）', 'success');
                executePrint(newDevice, serialNumber, modelNumber, purchasePrice, batteryCost, beltCost, desiredPrice);
            } else {
                showMessage('Bluetooth接続に失敗。プリンターの電源・ペアリング・距離を確認してください。', 'error');
                console.error('すべての接続方法が失敗しました');
            }
        });
    }, 1000);
}

// ネットワーク接続で印刷
function printViaNetwork(serialNumber, modelNumber, purchasePrice, batteryCost, beltCost, desiredPrice, printerIP) {
    showMessage('ネットワークプリンターに接続中...', 'success');
    
    try {
        const eposDevice = new epson.ePOSDevice();
        
        // ネットワーク接続
        eposDevice.connect(printerIP, 8008, function(data) {
            console.log('ネットワーク接続結果:', data);
            
            if (data === 'OK' || data === 'SSL_CONNECT_OK') {
                showMessage('プリンターに接続しました。印刷データ送信中...', 'success');
                executePrint(eposDevice, serialNumber, modelNumber, purchasePrice, batteryCost, beltCost, desiredPrice);
            } else {
                showMessage('ネットワークプリンターに接続できません。IPアドレス: ' + printerIP + ' を確認してください。エラー: ' + data, 'error');
                console.error('ネットワーク接続エラー:', data);
            }
        });
        
        // 再接続イベント
        eposDevice.onreconnecting = function() {
            console.log('プリンターへ再接続中...');
            showMessage('プリンターへ再接続中...', 'success');
        };
        
        eposDevice.onreconnect = function() {
            console.log('プリンターへ再接続しました');
            showMessage('プリンターへ再接続しました', 'success');
        };
        
        eposDevice.ondisconnect = function() {
            console.log('プリンターから切断されました');
        };
        
    } catch (error) {
        console.error('ネットワーク印刷エラー:', error);
        showMessage('ネットワーク印刷エラー: ' + error.message, 'error');
    }
}

// 印刷実行（共通処理）
function executePrint(eposDevice, serialNumber, modelNumber, purchasePrice, batteryCost, beltCost, desiredPrice) {
    eposDevice.createDevice('local_printer', eposDevice.DEVICE_TYPE_PRINTER,
        {'crypto': false, 'buffer': false},
        function(devobj, retcode) {
            if (retcode === 'OK') {
                const printerObj = devobj;
                
                // 日時生成
                const now = new Date();
                const dateString = `${now.getFullYear()}年${(now.getMonth()+1).toString().padStart(2,'0')}月${now.getDate().toString().padStart(2,'0')}日 ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} ${now.getSeconds().toString().padStart(2,'0')}秒`;
                const barcodeNumber = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${serialNumber.padStart(5, '0')}`;
                
                // 日本語設定を追加
                printerObj.addTextLang(printerObj.LANG_JA);
                
                // 印刷データ作成
                printerObj.addTextAlign(printerObj.ALIGN_CENTER);
                
                // ヘッダー行
                printerObj.addTextStyle(false, false, true, printerObj.COLOR_1);
                printerObj.addTextSize(2, 1);
                printerObj.addText(`T's time     ${serialNumber.padStart(5, '0')}\n`);
                printerObj.addText('--------------------------------\n');
                
                // 型番
                printerObj.addTextSize(1, 1);
                printerObj.addTextStyle(false, false, false, printerObj.COLOR_1);
                printerObj.addText(`${modelNumber}\n\n`);
                
                // 購入価格
                printerObj.addText(`購入価格　¥${Number(purchasePrice).toLocaleString()}-\n`);
                
                // 電池代
                if (batteryCost) {
                    printerObj.addText(`電池代　¥${Number(batteryCost).toLocaleString()}-\n`);
                }
                
                // ベルト代
                if (beltCost) {
                    printerObj.addText(`ベルト代　¥${Number(beltCost).toLocaleString()}-\n`);
                }
                
                printerObj.addText('\n');
                
                // 希望金額
                printerObj.addTextSize(2, 2);
                printerObj.addTextStyle(false, false, true, printerObj.COLOR_1);
                printerObj.addText(`希望金額　¥${Number(desiredPrice).toLocaleString()}-\n\n`);
                
                // 日時
                printerObj.addTextSize(1, 1);
                printerObj.addTextStyle(false, false, false, printerObj.COLOR_1);
                printerObj.addText(`${dateString}\n\n`);
                
                // QRコード（バーコードの代わり）
                printerObj.addSymbol(barcodeNumber, printerObj.SYMBOL_QRCODE_MODEL_2, printerObj.LEVEL_H, 5, 0, 0);
                printerObj.addText(`\n${barcodeNumber}\n`);
                
                printerObj.addFeedLine(2);
                printerObj.addCut(printerObj.CUT_FEED);
                
                // 印刷実行
                printerObj.send();
                
                showMessage('印刷を開始しました！', 'success');
                
                // 連番を自動的に1増やす
                saveSerialNumber(parseInt(serialNumber) + 1);
                updateSerialDisplay();
                updatePreview();
                
                eposDevice.disconnect();
            } else {
                showMessage('プリンター初期化エラー: ' + retcode, 'error');
                console.error('プリンター初期化エラー:', retcode);
            }
        }
    );
}

// フォームクリア関数
function clearForm() {
    document.getElementById('modelNumber').value = '';
    autoGrowTextarea(document.getElementById('modelNumber'));
    document.getElementById('categoryType').selectedIndex = 0;
    document.getElementById('otherCategory').value = '';
    document.getElementById('otherCategoryGroup').style.display = 'none';
    document.getElementById('operationType').selectedIndex = 0;
    document.getElementById('otherOperation').value = '';
    document.getElementById('otherOperationGroup').style.display = 'none';
    document.getElementById('purchasePrice').value = '';
    document.getElementById('batteryCost').value = '';
    document.getElementById('beltCost').value = '';
    document.getElementById('desiredPrice').value = '';
    // 連番はクリアしない
    updatePreview();
    showMessage('フォームをクリアしました（連番は維持されます）', 'success');
}

// メッセージ表示関数
function showMessage(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = 'status-message ' + type;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
        if (type === 'success' && !message.includes('接続中') && !message.includes('送信中')) {
            statusDiv.style.display = 'none';
        }
    }, 5000);
}

// === 履歴管理機能 ===

// 値札の内容をURLに平文で載せると、QR読み取りやアドレスバーから悪用できる。
// パスワードでXOR暗号化し、正しいパスワード入力後だけ中身を復元する。
function bytesToBase64Url(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(encoded) {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function expandKeystream(password, length, nonce) {
    const seed = String(password) + '|' + String(nonce) + '|TstimeQR-v1';
    let state = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        state ^= seed.charCodeAt(i);
        state = Math.imul(state, 16777619);
    }
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        out[i] = (state >>> 24) & 0xff;
    }
    return out;
}

function encryptLabelPayload(payload, password) {
    const plain = new TextEncoder().encode(JSON.stringify(payload));
    const nonce = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    const keystream = expandKeystream(password, plain.length, nonce);
    const cipher = new Uint8Array(plain.length);
    for (let i = 0; i < plain.length; i++) {
        cipher[i] = plain[i] ^ keystream[i];
    }
    return 'e1.' + bytesToBase64Url(new TextEncoder().encode(nonce)) + '.' + bytesToBase64Url(cipher);
}

function decryptLabelPayload(token, password) {
    try {
        if (!token || token.indexOf('e1.') !== 0) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const nonce = new TextDecoder().decode(base64UrlToBytes(parts[1]));
        const cipher = base64UrlToBytes(parts[2]);
        const keystream = expandKeystream(password, cipher.length, nonce);
        const plain = new Uint8Array(cipher.length);
        for (let i = 0; i < cipher.length; i++) {
            plain[i] = cipher[i] ^ keystream[i];
        }
        const parsed = JSON.parse(new TextDecoder().decode(plain));
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
        return null;
    }
}

// 旧形式（暗号化前）のQRコード互換用
function decodeLabelPayloadLegacy(encoded) {
    try {
        const bytes = base64UrlToBytes(encoded);
        const parsed = JSON.parse(new TextDecoder().decode(bytes));
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
        return null;
    }
}

function packedToPendingPayload(packed) {
    if (!packed || typeof packed !== 'object') return null;

    const serialNumber = packed.s != null ? String(packed.s) : null;
    const parsedSerial = serialNumber === null ? null : Number(serialNumber);
    const validSerial = Number.isSafeInteger(parsedSerial) && parsedSerial > 0
        ? parsedSerial
        : null;

    return {
        serialNumber: serialNumber,
        validSerial: validSerial,
        modelNumber: packed.m != null ? String(packed.m) : null,
        category: packed.c != null ? String(packed.c) : null,
        operation: packed.o != null ? String(packed.o) : null,
        purchasePrice: packed.p1 != null ? String(packed.p1) : null,
        batteryCost: packed.p2 != null ? String(packed.p2) : null,
        beltCost: packed.p3 != null ? String(packed.p3) : null,
        desiredPrice: packed.p4 != null ? String(packed.p4) : null,
        printer: packed.pr != null ? String(packed.pr) : null
    };
}

// QRから開いた値札は、パスワード確認後にだけフォームへ反映する
const QR_LOAD_PASSWORD = '1121';
const QR_PASSWORD_MAX_ATTEMPTS = 3;
let pendingQrEncrypted = null;
let pendingQrLegacyPayload = null;
let qrPasswordFailCount = 0;

// データURLを生成（パスワードで暗号化した1パラメータ）
function generateDataURL(modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice, serialNumber) {
    const baseURL = window.location.origin + window.location.pathname;
    const payload = {};
    const printer = loadPrinterSelection();

    if (serialNumber) payload.s = String(serialNumber);
    if (modelNumber) payload.m = modelNumber;
    if (category) payload.c = category;
    if (operation) payload.o = operation;
    if (purchasePrice) payload.p1 = purchasePrice;
    if (batteryCost) payload.p2 = batteryCost;
    if (beltCost) payload.p3 = beltCost;
    if (desiredPrice) payload.p4 = desiredPrice;
    if (printer) payload.pr = printer;

    return baseURL + '?d=' + encryptLabelPayload(payload, QR_LOAD_PASSWORD);
}

function clearUrlParams() {
    const cleanURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanURL);
}

function clearPendingQrData() {
    pendingQrEncrypted = null;
    pendingQrLegacyPayload = null;
    qrPasswordFailCount = 0;
}

function applyQrPayload(payload, options) {
    if (!payload) return;
    options = options || {};

    if (payload.serialNumber) {
        if (payload.validSerial !== null) {
            saveSerialNumber(payload.validSerial);
            updateSerialDisplay();
        } else {
            console.warn('QRコードの連番が不正なため読み込みません:', payload.serialNumber);
        }
    }

    if (payload.modelNumber) document.getElementById('modelNumber').value = payload.modelNumber;
    if (payload.purchasePrice) document.getElementById('purchasePrice').value = payload.purchasePrice;
    if (payload.batteryCost) document.getElementById('batteryCost').value = payload.batteryCost;
    if (payload.beltCost) document.getElementById('beltCost').value = payload.beltCost;
    if (payload.desiredPrice) document.getElementById('desiredPrice').value = payload.desiredPrice;

    if (payload.category) {
        const categorySelect = document.getElementById('categoryType');
        const categoryOptions = Array.from(categorySelect.options).map(opt => opt.value);

        if (categoryOptions.includes(payload.category)) {
            categorySelect.value = payload.category;
        } else {
            categorySelect.value = 'other';
            document.getElementById('otherCategory').value = payload.category;
            document.getElementById('otherCategoryGroup').style.display = 'block';
        }
    }

    if (payload.operation) {
        const operationSelect = document.getElementById('operationType');
        const operationOptions = Array.from(operationSelect.options).map(opt => opt.value);

        if (operationOptions.includes(payload.operation)) {
            operationSelect.value = payload.operation;
        } else {
            operationSelect.value = 'other';
            document.getElementById('otherOperation').value = payload.operation;
            document.getElementById('otherOperationGroup').style.display = 'block';
        }
    }

    // QRに記録された印刷時のプリンターへ戻す
    if (payload.printer) {
        applyPrinterSelection(payload.printer);
    }

    const modelNumberField = document.getElementById('modelNumber');
    if (modelNumberField) {
        autoLineBreakSmart(modelNumberField, PRINT_LINE_UNITS);
        autoGrowTextarea(modelNumberField);
    }

    if (!options.silent) {
        const loadedSerial = payload.validSerial !== null
            ? `（連番: ${String(payload.validSerial).padStart(5, '0')}）`
            : '';
        showMessage('QRコードから値札データを読み込みました' + loadedSerial, 'success');
    }
    updatePreview();
}

function showQrPasswordPrompt() {
    const modal = document.getElementById('passwordModal');
    const overlay = document.getElementById('overlay');
    const input = document.getElementById('qrPasswordInput');
    const error = document.getElementById('qrPasswordError');

    document.getElementById('sideMenu').classList.remove('active');
    document.getElementById('historyModal').classList.remove('active');

    qrPasswordFailCount = 0;

    if (error) {
        error.hidden = true;
        error.textContent = 'パスワードが違います';
    }
    if (input) {
        input.value = '';
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    overlay.classList.add('overlay-opaque');
    document.body.classList.add('qr-locked');

    setTimeout(function() {
        if (input) input.focus();
    }, 50);
}

function hideQrPasswordPrompt() {
    const modal = document.getElementById('passwordModal');
    const overlay = document.getElementById('overlay');
    const input = document.getElementById('qrPasswordInput');
    const error = document.getElementById('qrPasswordError');

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('overlay-opaque');
    document.body.classList.remove('qr-locked');
    if (error) error.hidden = true;
    if (input) input.value = '';

    if (!document.getElementById('historyModal').classList.contains('active') &&
        !document.getElementById('sideMenu').classList.contains('active')) {
        overlay.classList.remove('active');
    }
}

// キャンセルやパスワード失敗上限で、値札画面ごと完全に消す
function dismissQrAccessPage() {
    clearPendingQrData();

    // まずタブ自体を閉じる。閉じられればURLも履歴も残らない。
    // window.open('', '_self') はスクリプト起点でないタブでも
    // close() を受け付けさせるための定番の前処理
    try {
        window.open('', '_self');
        window.close();
    } catch (e) {
        // ignore
    }

    // 閉じられない環境（iOSのSafariやホーム画面アプリ）では
    // about:blank へ置き換えて、URLと戻り先を消す
    setTimeout(function() {
        try {
            window.location.replace('about:blank');
        } catch (e) {
            try {
                document.open();
                document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title></title><style>html,body{margin:0;height:100%;background:#fff;}</style></head><body></body></html>');
                document.close();
            } catch (e2) {
                // ignore
            }
        }
    }, 100);
}

function resolveQrPayloadWithPassword(entered) {
    if (pendingQrEncrypted) {
        const packed = decryptLabelPayload(pendingQrEncrypted, entered);
        return packedToPendingPayload(packed);
    }

    if (pendingQrLegacyPayload && entered === QR_LOAD_PASSWORD) {
        return pendingQrLegacyPayload;
    }

    return null;
}

function submitQrPasswordPrompt() {
    const input = document.getElementById('qrPasswordInput');
    const error = document.getElementById('qrPasswordError');
    const entered = input ? input.value.trim() : '';
    const payload = resolveQrPayloadWithPassword(entered);

    if (!payload) {
        qrPasswordFailCount += 1;
        const remaining = QR_PASSWORD_MAX_ATTEMPTS - qrPasswordFailCount;

        if (remaining <= 0) {
            dismissQrAccessPage();
            return;
        }

        if (error) {
            error.hidden = false;
            error.textContent = 'パスワードが違います（残り' + remaining + '回）';
        }
        if (input) {
            input.value = '';
            input.focus();
        }
        return;
    }

    clearPendingQrData();
    hideQrPasswordPrompt();
    applyQrPayload(payload);
}

function cancelQrPasswordPrompt() {
    dismissQrAccessPage();
}

// URLパラメータから値札データを読み込む
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

    // NIMBOTバーコード経由: ?b=ID または ?b=T1.xxx
    const barcodeParam = urlParams.get('b');
    if (barcodeParam) {
        clearUrlParams();
        const record = decodeNimbotBarcodeValue(barcodeParam);
        if (record) {
            applyNimbotBarcodeRecord(record);
            return;
        }
        showMessage('バーコードデータが見つかりませんでした', 'error');
        return;
    }

    const encoded = urlParams.get('d');

    // 新形式（暗号化）: パスワード入力前に中身を復元しない
    if (encoded && encoded.indexOf('e1.') === 0) {
        pendingQrEncrypted = encoded;
        pendingQrLegacyPayload = null;
        clearUrlParams();
        showQrPasswordPrompt();
        return;
    }

    // 暗号化前の d=... 形式
    if (encoded) {
        const packed = decodeLabelPayloadLegacy(encoded);
        const payload = packedToPendingPayload(packed);
        if (payload && (payload.serialNumber || payload.modelNumber || payload.category ||
            payload.operation || payload.purchasePrice || payload.batteryCost ||
            payload.beltCost || payload.desiredPrice)) {
            pendingQrEncrypted = null;
            pendingQrLegacyPayload = payload;
            clearUrlParams();
            showQrPasswordPrompt();
            return;
        }
    }

    // さらに古い ?serial=&model=... 形式
    const serialNumber = urlParams.get('serial');
    const parsedSerial = serialNumber === null ? null : Number(serialNumber);
    const validSerial = Number.isSafeInteger(parsedSerial) && parsedSerial > 0
        ? parsedSerial
        : null;
    const modelNumber = urlParams.get('model');
    const category = urlParams.get('category');
    const operation = urlParams.get('operation');
    const purchasePrice = urlParams.get('price1');
    const batteryCost = urlParams.get('price2');
    const beltCost = urlParams.get('price3');
    const desiredPrice = urlParams.get('price4');

    if (serialNumber || modelNumber || category || operation ||
        purchasePrice || batteryCost || beltCost || desiredPrice) {
        pendingQrEncrypted = null;
        pendingQrLegacyPayload = {
            serialNumber: serialNumber,
            validSerial: validSerial,
            modelNumber: modelNumber,
            category: category,
            operation: operation,
            purchasePrice: purchasePrice,
            batteryCost: batteryCost,
            beltCost: beltCost,
            desiredPrice: desiredPrice
        };
        clearUrlParams();
        showQrPasswordPrompt();
    }
}

// 履歴に保存
function saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice, extra) {
    try {
        const history = getHistory();
        extra = extra || {};
        
        const historyItem = {
            date: new Date().toISOString(),
            serialNumber: serialNumber,
            category: category || '',
            modelNumber: modelNumber,
            operation: operation || '',
            purchasePrice: purchasePrice || '',
            batteryCost: batteryCost || '',
            beltCost: beltCost || '',
            desiredPrice: desiredPrice,
            printer: extra.printer || loadPrinterSelection(),
            barcodeId: extra.barcodeId || '',
            barcodeValue: extra.barcodeValue || ''
        };
        
        // 最新の履歴を先頭に追加
        history.unshift(historyItem);
        
        // 最新50件のみ保持
        if (history.length > 50) {
            history.splice(50);
        }
        
        localStorage.setItem('printHistory', JSON.stringify(history));
        console.log('履歴を保存しました:', historyItem);
    } catch (error) {
        console.error('履歴保存エラー:', error);
    }
}

// 履歴を取得
function getHistory() {
    try {
        const historyJSON = localStorage.getItem('printHistory');
        return historyJSON ? JSON.parse(historyJSON) : [];
    } catch (error) {
        console.error('履歴読み込みエラー:', error);
        return [];
    }
}

let barcodeScanStream = null;
let barcodeScanTimer = null;
let barcodeScanDetector = null;

function setBarcodeScanStatus(text) {
    const el = document.getElementById('barcodeScanStatus');
    if (el) el.textContent = text || '';
}

function openBarcodeScanModal() {
    const modal = document.getElementById('barcodeScanModal');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    const input = document.getElementById('barcodeScanInput');
    if (input) input.value = '';
    setBarcodeScanStatus('');
    startBarcodeCamera();
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    if (sideMenu) sideMenu.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function closeBarcodeScanModal() {
    stopBarcodeCamera();
    const modal = document.getElementById('barcodeScanModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

function submitBarcodeScanInput() {
    const input = document.getElementById('barcodeScanInput');
    const code = input ? input.value.trim() : '';
    if (!code) {
        setBarcodeScanStatus('バーコードを入力してください');
        return;
    }
    handleScannedBarcode(code);
}

function handleScannedBarcode(code) {
    const record = decodeNimbotBarcodeValue(code);
    if (!record) {
        setBarcodeScanStatus('データが見つかりません。この端末で印字したバーコードか確認してください。');
        showMessage('バーコードデータを読み取れませんでした', 'error');
        return;
    }
    closeBarcodeScanModal();
    applyNimbotBarcodeRecord(record);
}

async function startBarcodeCamera() {
    stopBarcodeCamera();
    const video = document.getElementById('barcodeScanVideo');
    if (!video) return;

    if (!window.BarcodeDetector) {
        setBarcodeScanStatus('この端末はカメラ読取未対応です。下に番号を入力してください。');
        return;
    }

    try {
        barcodeScanDetector = new BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code']
        });
        barcodeScanStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { ideal: 'environment' } }
        });
        video.srcObject = barcodeScanStream;
        await video.play();
        setBarcodeScanStatus('カメラでバーコードを枠に合わせてください');

        barcodeScanTimer = setInterval(async function() {
            if (!barcodeScanDetector || !video || video.readyState < 2) return;
            try {
                const codes = await barcodeScanDetector.detect(video);
                if (codes && codes.length && codes[0].rawValue) {
                    handleScannedBarcode(codes[0].rawValue);
                }
            } catch (e) {
                // 連続検出中の一時エラーは無視
            }
        }, 700);
    } catch (error) {
        console.warn('バーコードカメラ起動失敗', error);
        setBarcodeScanStatus('カメラを開けませんでした。番号入力を使ってください。');
    }
}

function stopBarcodeCamera() {
    if (barcodeScanTimer) {
        clearInterval(barcodeScanTimer);
        barcodeScanTimer = null;
    }
    barcodeScanDetector = null;
    const video = document.getElementById('barcodeScanVideo');
    if (barcodeScanStream) {
        barcodeScanStream.getTracks().forEach(function(track) { track.stop(); });
        barcodeScanStream = null;
    }
    if (video) {
        video.pause();
        video.srcObject = null;
    }
}

// 履歴アイテムを削除
function deleteHistoryItem(index) {
    try {
        const history = getHistory();
        history.splice(index, 1);
        localStorage.setItem('printHistory', JSON.stringify(history));
        console.log('履歴を削除しました:', index);
    } catch (error) {
        console.error('履歴削除エラー:', error);
    }
}

// 履歴モーダルを表示
function showHistoryModal() {
    const modal = document.getElementById('historyModal');
    const overlay = document.getElementById('overlay');
    const historyList = document.getElementById('historyList');

    // サイドメニューを閉じる
    document.getElementById('sideMenu').classList.remove('active');

    // モーダルを即座に表示（反応速度向上）
    modal.classList.add('active');
    overlay.classList.add('active');

    // イベント委譲は一度だけ設定する（毎回付けると確認ダイアログが重なる）
    setupHistoryEventDelegation(historyList);

    // 履歴を読み込んで表示
    setTimeout(function() {
        renderHistoryList(historyList);
    }, 0);
}

function renderHistoryList(historyList) {
    const history = getHistory();

    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">履歴がありません</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    history.forEach(function(item, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'history-item-wrapper';
        wrapper.dataset.index = String(index);

        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const date = new Date(item.date);
        const dateStr = `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

        historyItem.innerHTML = `
            <div class="history-item-header">
                <span class="history-date">${dateStr}</span>
                <span class="history-serial">No.${item.serialNumber}</span>
            </div>
            <div class="history-item-body">
                ${item.category ? `<div class="history-category">${item.category}</div>` : ''}
                <div class="history-model">${item.modelNumber}</div>
                ${item.operation ? `<div class="history-operation">${item.operation}</div>` : ''}
                <div class="history-price">¥${Number(item.desiredPrice).toLocaleString()}</div>
            </div>
        `;

        const actions = document.createElement('div');
        actions.className = 'history-item-actions';

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-button';
        deleteButton.textContent = '削除';
        deleteButton.setAttribute('aria-label', 'この履歴を削除');

        actions.appendChild(deleteButton);
        historyItem.appendChild(actions);
        wrapper.appendChild(historyItem);
        fragment.appendChild(wrapper);
    });

    historyList.innerHTML = '';
    historyList.appendChild(fragment);
}

// 履歴リストのイベント委譲設定（一度だけ）
let historyDelegationBound = false;
let historyDeleteConfirmOpen = false;

function setupHistoryEventDelegation(historyList) {
    if (historyDelegationBound || !historyList) return;
    historyDelegationBound = true;

    historyList.addEventListener('click', function(e) {
        const deleteButton = e.target.closest('.delete-button');
        if (deleteButton) {
            e.preventDefault();
            e.stopPropagation();

            // confirm中の多重発火や、削除直後の再クリックを防ぐ
            if (historyDeleteConfirmOpen) return;

            const wrapper = deleteButton.closest('.history-item-wrapper');
            if (!wrapper) return;
            const index = parseInt(wrapper.dataset.index, 10);
            if (!Number.isInteger(index) || index < 0) return;

            historyDeleteConfirmOpen = true;
            const confirmed = window.confirm('この履歴を削除しますか？');
            historyDeleteConfirmOpen = false;

            if (confirmed) {
                deleteHistoryItem(index);
                renderHistoryList(historyList);
            }
            return;
        }

        const historyItem = e.target.closest('.history-item');
        if (!historyItem) return;

        const wrapper = historyItem.closest('.history-item-wrapper');
        if (!wrapper) return;
        const index = parseInt(wrapper.dataset.index, 10);
        const history = getHistory();
        if (!Number.isInteger(index) || !history[index]) return;

        loadFromHistory(history[index]);
        closeHistoryModal();
    });
}

// 履歴モーダルを閉じる
function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    const overlay = document.getElementById('overlay');

    modal.classList.remove('active');
    // パスワード確認中でなければオーバーレイも閉じる
    if (!document.getElementById('passwordModal').classList.contains('active') &&
        !document.getElementById('barcodeScanModal').classList.contains('active') &&
        !document.getElementById('sideMenu').classList.contains('active')) {
        overlay.classList.remove('active');
    }
}

// 履歴からフォームに読み込む
function loadFromHistory(item) {
    document.getElementById('modelNumber').value = item.modelNumber;
    document.getElementById('purchasePrice').value = item.purchasePrice || '';
    document.getElementById('batteryCost').value = item.batteryCost || '';
    document.getElementById('beltCost').value = item.beltCost || '';
    document.getElementById('desiredPrice').value = item.desiredPrice;

    // 履歴の連番を現在の連番として復元する（その連番のまま再印刷できるようにする）
    if (item.serialNumber !== undefined && item.serialNumber !== null && item.serialNumber !== '') {
        const parsedSerial = Number(String(item.serialNumber).replace(/[^\d]/g, ''));
        if (Number.isSafeInteger(parsedSerial) && parsedSerial > 0) {
            saveSerialNumber(parsedSerial);
            updateSerialDisplay();
        }
    }
    
    // カテゴリーの設定
    if (item.category) {
        const categorySelect = document.getElementById('categoryType');
        const categoryOptions = Array.from(categorySelect.options).map(opt => opt.value);
        
        if (categoryOptions.includes(item.category)) {
            categorySelect.value = item.category;
            document.getElementById('otherCategoryGroup').style.display = 'none';
        } else {
            categorySelect.value = 'other';
            document.getElementById('otherCategory').value = item.category;
            document.getElementById('otherCategoryGroup').style.display = 'block';
        }
    }
    
    // 稼働方式の設定
    if (item.operation) {
        const operationSelect = document.getElementById('operationType');
        const operationOptions = Array.from(operationSelect.options).map(opt => opt.value);
        
        if (operationOptions.includes(item.operation)) {
            operationSelect.value = item.operation;
            document.getElementById('otherOperationGroup').style.display = 'none';
        } else {
            operationSelect.value = 'other';
            document.getElementById('otherOperation').value = item.operation;
            document.getElementById('otherOperationGroup').style.display = 'block';
        }
    }

    // 印刷時のプリンターがあれば復元する
    if (item.printer) {
        applyPrinterSelection(item.printer);
    }

    const modelNumberField = document.getElementById('modelNumber');
    if (modelNumberField) {
        autoLineBreakSmart(modelNumberField, PRINT_LINE_UNITS);
        autoGrowTextarea(modelNumberField);
    }
    
    updatePreview();
    showMessage('履歴から値札データを読み込みました', 'success');
}
