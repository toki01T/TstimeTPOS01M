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
    return saved || 'printassist'; // デフォルトはTM Print Assistant
}

function updatePrinterDisplay(printer) {
    const printAssistBtn = document.getElementById('printAssistOption');
    const tmAssistantBtn = document.getElementById('tmAssistantOption');
    const mpB20Btn = document.getElementById('mpB20Option');
    const printerInfo = document.getElementById('printerInfo');
    const labels = {
        printassist: 'TM Print Assistant',
        tmassistant: 'TM Assistant',
        mpb20: 'MP-B20'
    };

    [printAssistBtn, tmAssistantBtn, mpB20Btn].forEach(function(btn) {
        if (btn) btn.classList.remove('active');
    });

    if (printer === 'tmassistant' && tmAssistantBtn) {
        tmAssistantBtn.classList.add('active');
    } else if (printer === 'mpb20' && mpB20Btn) {
        mpB20Btn.classList.add('active');
    } else if (printAssistBtn) {
        printAssistBtn.classList.add('active');
        printer = 'printassist';
    }

    if (printerInfo) {
        printerInfo.textContent = '現在: ' + (labels[printer] || 'TM Print Assistant');
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // URLパラメータから値札データを読み込む
    loadFromURL();
    
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
        savePrinterSelection('printassist');
        updatePrinterDisplay('printassist');
        showMessage('プリンターをTM Print Assistantに設定しました', 'success');
    });
    
    document.getElementById('tmAssistantOption').addEventListener('click', function() {
        savePrinterSelection('tmassistant');
        updatePrinterDisplay('tmassistant');
        showMessage('プリンターをTM Assistantに設定しました', 'success');
    });

    document.getElementById('mpB20Option').addEventListener('click', function() {
        savePrinterSelection('mpb20');
        updatePrinterDisplay('mpb20');
        showMessage('プリンターをMP-B20に設定しました', 'success');
        preloadMpb20FontIfSelected();
    });
    
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

    // BIZ UDゴシックはMP-B20の印字にしか使わないため、
    // MP-B20を選んでいるときだけ先読みする（4MB超のため他機種では読み込まない）
    preloadMpb20FontIfSelected();

    const versionLabel = document.getElementById('appVersion');
    if (versionLabel) versionLabel.textContent = APP_VERSION;

    // PWAではショートカット名で戻る。照合用に表示する
    const returnLabel = document.getElementById('returnTarget');
    if (returnLabel) {
        returnLabel.textContent = getPrintReturnUrl();
    }

    // 印刷を挟まずに、同じ戻り先（ショートカット）を試せるようにする
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
    xml += '<text lang="ja"/>';

    // 58mm用紙・width="2"で1行16文字。
    // 「’」は全角幅なので、スペースを2個にして連番まで1行に収める。
    // 「❜」(U+275C)はShift_JISに無くプリンター側で脱落するため使えない
    xml += '<text width="2" height="1" em="true"/>';
    xml += '<text align="center"/>';
    xml += `<text>T’s time  ${labelData.serialHalfWidth}&#10;&#10;</text>`;

    xml += '<text width="1" height="1" em="false"/>';
    if (labelData.category) {
        xml += `<text>${escapeXml(labelData.category)}&#10;&#10;</text>`;
    }

    xml += '<text align="center"/>';
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
    xml += `<text>${labelData.desiredLine}&#10;&#10;</text>`;

    if (labelData.printNotice) {
        xml += '<text width="1" height="1" em="false"/>';
        xml += '<text>﹡大幅に金額が離れている場合は&#10;</text>';
        xml += '<text>お売りする事が出来ません。&#10;</text>';
        xml += '<text>ご了承下さい。&#10;&#10;</text>';
    }

    xml += '<text width="1" height="1" em="false"/>';
    xml += `<text>${escapeXml(labelData.dateString)}&#10;&#10;</text>`;

    xml += `<symbol type="qrcode_model_2" level="h" width="3" height="0" size="0">${escapeXml(labelData.dataURL)}</symbol>`;
    xml += `<text>&#10;${labelData.qrcodeNumber}&#10;</text>`;
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

// 印刷アプリからの戻り先URL。
// ホーム画面のWebアプリでは、印刷完了後にショートカットを自動起動して戻す。
// （webapp://を直接渡すとiOS 26で開けないことがある）
function getPrintReturnUrl() {
    if (isStandaloneWebApp()) return getShortcutReturnUrl();
    return window.location.origin + window.location.pathname;
}

// 印刷前の確認。
// キャンセルはApp Storeへ移動せず、入力内容を残したままこのアプリに留まる
function confirmPrint(appName) {
    const ok = confirm(`${appName}で印刷します。\n\n「OK」= 印刷する\n「キャンセル」= 印刷せずアプリに戻る`);
    if (!ok) {
        showMessage('印刷をキャンセルしました', 'success');
    }
    return ok;
}

// Epson TM Print Assistant印刷（iPad/iPhone）
function printWithPrintAssist(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    console.log('=== TM Print Assistant印刷開始 ===');
    console.log('入力データ:', {serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice});

    if (!confirmPrint('Epson TM Print Assistant')) return;
    
    try {
        const labelData = buildEposLabelData(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);

        console.log('日時:', labelData.dateString);
        console.log('QRコード番号:', labelData.qrcodeNumber);
        console.log('データURL:', labelData.dataURL);

        const xml = buildEposPrintXml(labelData);
        
        console.log('生成されたXML:');
        console.log(xml);
        
        // TM Print Assistant公式の方法：XMLを直接encodeURIComponentでエンコード
        // Base64エンコードは不要！
        const encodedXML = encodeURIComponent(xml);
        console.log('URLエンコード完了');
        console.log('エンコード後の文字数:', encodedXML.length);
        console.log('エンコードデータ（最初の100文字）:', encodedXML.substring(0, 100));
        
        // URLスキーム生成（TM Print Assistant公式フォーマット）
        // tmprintassistant:// 形式を使用
        const returnUrl = getPrintReturnUrl();
        const successParam = returnUrl ? `success=${encodeURIComponent(returnUrl)}&` : '';
        const printURL = `tmprintassistant://tmprintassistant.epson.com/print?${successParam}ver=1&data-type=eposprintxml&reselect=yes&data=${encodedXML}`;
        console.log('完全なURLスキーム長:', printURL.length);
        console.log('URLスキーム（最初の200文字）:', printURL.substring(0, 200));
        
        // デバッグ用：ユーザーに表示
        showMessage(`印刷データを生成しました（XML: ${xml.length}文字）。TM Print Assistantを起動します...`, 'success');
        
        // 少し待ってからURLスキームを開く
        setTimeout(function() {
            console.log('URLスキームを開きます...');
            
            // iOS/iPadで確実に動作する方法
            const link = document.createElement('a');
            link.href = printURL;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('URLスキーム起動完了');
            
            showMessage('TM Print Assistantアプリに印刷データを送信しました', 'success');
        }, 500);
        
        console.log('=== TM Print Assistant起動処理完了 ===');
        
        // 履歴を保存
        saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
        
        // 連番を自動的に1増やして保存
        const newSerial = parseInt(serialNumber) + 1;
        saveSerialNumber(newSerial);
        updateSerialDisplay();
        updatePreview();
        
        showMessage('印刷データを送信しました。連番を ' + newSerial + ' に更新しました。', 'success');
        
    } catch (error) {
        console.error('=== TM Print Assistant印刷エラー ===');
        console.error('エラー詳細:', error);
        console.error('エラーメッセージ:', error.message);
        console.error('エラースタック:', error.stack);
        showMessage('印刷エラー: ' + error.message + ' (コンソールで詳細を確認してください)', 'error');
    }
}

// TM Assistant印刷（iPad/iPhone）
function printWithTMAssistant(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    console.log('=== TM Assistant印刷開始 ===');
    console.log('入力データ:', {serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice});
    
    if (!confirmPrint('TM Assistant')) return;
    
    try {
        const labelData = buildEposLabelData(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);

        console.log('日時:', labelData.dateString);
        console.log('QRコード番号:', labelData.qrcodeNumber);
        console.log('データURL:', labelData.dataURL);

        const xml = buildEposPrintXml(labelData);
        
        console.log('生成されたXML:');
        console.log(xml);
        
        // TM Assistant用のBase64エンコード
        const base64XML = btoa(unescape(encodeURIComponent(xml)));
        console.log('Base64エンコード完了');
        console.log('エンコード後の文字数:', base64XML.length);
        
        // URLスキーム生成（TM Assistant公式フォーマット）
        // tmassistant:// 形式を使用
        const printURL = `tmassistant://print?data=${encodeURIComponent(base64XML)}`;
        console.log('完全なURLスキーム長:', printURL.length);
        console.log('URLスキーム（最初の200文字）:', printURL.substring(0, 200));
        
        // デバッグ用：ユーザーに表示
        showMessage(`印刷データを生成しました（XML: ${xml.length}文字）。TM Assistantを起動します...`, 'success');
        
        // 少し待ってからURLスキームを開く
        setTimeout(function() {
            console.log('URLスキームを開きます...');
            
            // iOS/iPadで確実に動作する方法
            const link = document.createElement('a');
            link.href = printURL;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('URLスキーム起動完了');
            
            showMessage('TM Assistantアプリに印刷データを送信しました', 'success');
        }, 500);
        
        console.log('=== TM Assistant起動処理完了 ===');
        
        // 履歴を保存
        saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
        
        // 連番を自動的に1増やして保存
        const newSerial = parseInt(serialNumber) + 1;
        saveSerialNumber(newSerial);
        updateSerialDisplay();
        updatePreview();
        
        showMessage('印刷データを送信しました。連番を ' + newSerial + ' に更新しました。', 'success');
        
    } catch (error) {
        console.error('=== TM Assistant印刷エラー ===');
        console.error('エラー詳細:', error);
        console.error('エラーメッセージ:', error.message);
        console.error('エラースタック:', error.stack);
        showMessage('印刷エラー: ' + error.message + ' (コンソールで詳細を確認してください)', 'error');
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
    ctx.fillText(text, Math.round(centerX), Math.round(y));
}

function applyMpb20Font(ctx, fontFamily, size, weight) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
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
const MPB20_FONT_FAMILY = `"${MPB20_FONT_NAME}"`;
let mpb20FontLoadPromise = null;
let mpb20FontFace = null;

// 「T❜s time」の行だけは見た目を変えたくないので、従来のフォントで描く
const MPB20_HEADER_FONT_FAMILY = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';

// 印刷時に待たせたくないので先読みする。
// ただしMP-B20以外では一切使わないフォントなので、選択中のときだけ読む
function preloadMpb20FontIfSelected() {
    if (loadPrinterSelection() !== 'mpb20') return;
    ensurePrintFontReady().catch(function(error) {
        // 失敗しても印刷時に再試行し、そこで結果を明示する
        console.warn('BIZ UDゴシックの先読み失敗', error);
    });
}

async function ensurePrintFontReady() {
    if (!document.fonts || typeof FontFace === 'undefined') {
        throw new Error('この端末では印字フォントを読み込めません');
    }

    if (mpb20FontFace &&
        mpb20FontFace.status === 'loaded' &&
        document.fonts.has(mpb20FontFace)) {
        return;
    }

    if (!mpb20FontLoadPromise) {
        mpb20FontLoadPromise = (async function() {
            const fontUrl = new URL('fonts/BIZUDGothic-Bold.ttf', document.baseURI).href;
            mpb20FontFace = new FontFace(
                MPB20_FONT_NAME,
                `url("${fontUrl}") format("truetype")`,
                { style: 'normal', weight: '700' }
            );

            await mpb20FontFace.load();
            document.fonts.add(mpb20FontFace);
            await document.fonts.ready;

            if (mpb20FontFace.status !== 'loaded' ||
                !document.fonts.has(mpb20FontFace)) {
                throw new Error('BIZ UDゴシックの読み込みを確認できませんでした');
            }
        })().catch(function(error) {
            // 一時的な通信・キャッシュ不良なら印刷ボタン押下時に再試行できるようにする
            mpb20FontLoadPromise = null;
            mpb20FontFace = null;
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

async function createMPB20LabelPdf(labelData) {
    await ensurePrintFontReady();

    // MP-B20は203dpi（8ドット/mm）。58mm用紙の実印字幅48mmに1:1で合わせる
    const pxPerMm = 8;
    const widthMm = 48;
    const widthPx = widthMm * pxPerMm; // 384
    const contentWidthPx = widthPx - 16;
    const centerX = widthPx / 2;
    const blockGapPx = 2 * pxPerMm; // 連番・カテゴリー・型番の間隔2mm
    // 用紙を節約するため上端まで詰める。文字は上端が基準なので0でも欠けない
    const paddingTop = 0;
    // MP-B20はサーマルヘッドから紙排出口まで距離があり、印字直後はその分が本体内に残る。
    // URL Print Agentに追加フィードを指示する手段が無いため、末尾の余白で押し出す
    const paddingBottom = 14 * pxPerMm;
    const fontFamily = MPB20_FONT_FAMILY;
    // 型番が長いほどQRのセル数が増えるので、大きさは1セル3ドットを保てるよう可変にする
    const qr = createPrintableQRCode(labelData.dataURL, contentWidthPx);
    const qrSize = qr.size;

    const fonts = {
        header: { size: 34, weight: 'bold', line: 42 },
        body: { size: 26, weight: 'bold', line: 34 },
        price: { size: 24, weight: 'bold', line: 32 },
        desired: { size: 50, weight: 'bold', line: 58 },
        notice: { size: 22, weight: 'bold', line: 28 },
        footer: { size: 22, weight: 'bold', line: 28 }
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
    yEstimate += fonts.footer.line + qrSize + 10 + fonts.footer.line + paddingBottom;

    const finalHeight = Math.ceil(yEstimate);

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
                drawFittedLine(ctx, line, centerX, y, contentWidthPx, fontFamily, fonts.notice.size, fonts.notice.weight);
                y += fonts.notice.line;
            });
            y += 14;
        }

        drawFittedLine(ctx, labelData.dateString, centerX, y, contentWidthPx, fontFamily, fonts.footer.size, fonts.footer.weight);
        y += fonts.footer.line;

        // 補間するとセルの境界がドット境界からずれるため、拡大は等倍コピーで行う
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qr.canvas, Math.round(centerX - qrSize / 2), Math.round(y), qrSize, qrSize);
        ctx.imageSmoothingEnabled = true;
        y += qrSize + 10;

        drawFittedLine(ctx, labelData.qrcodeNumber, centerX, y, contentWidthPx, fontFamily, fonts.footer.size, fonts.footer.weight);
    };

    // 印字ドットと等倍で文字を描くと画線が1ドット未満になって掠れるため、
    // 拡大して描いてから等倍へ縮小し、そのうえでドットを判定する。
    // 型番が長いと拡大後の高さが端末のキャンバス上限を超えて下部が欠けるので、
    // 横帯に区切って描き、帯ごとに縮小して貼り合わせる
    const supersample = 3;
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
    await waitForNextFrame();

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

// データURLを生成
function generateDataURL(modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice, serialNumber) {
    const baseURL = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    if (serialNumber) params.append('serial', serialNumber);
    if (modelNumber) params.append('model', modelNumber);
    if (category) params.append('category', category);
    if (operation) params.append('operation', operation);
    if (purchasePrice) params.append('price1', purchasePrice);
    if (batteryCost) params.append('price2', batteryCost);
    if (beltCost) params.append('price3', beltCost);
    if (desiredPrice) params.append('price4', desiredPrice);
    
    return baseURL + '?' + params.toString();
}

// QRから開いた値札は、パスワード確認後にだけフォームへ反映する
const QR_LOAD_PASSWORD = '4126';
let pendingQrPayload = null;

function clearUrlParams() {
    const cleanURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanURL);
}

function applyQrPayload(payload) {
    if (!payload) return;

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

    const modelNumberField = document.getElementById('modelNumber');
    if (modelNumberField) {
        autoLineBreakSmart(modelNumberField, PRINT_LINE_UNITS);
        autoGrowTextarea(modelNumberField);
    }

    const loadedSerial = payload.validSerial !== null
        ? `（連番: ${String(payload.validSerial).padStart(5, '0')}）`
        : '';
    showMessage('QRコードから値札データを読み込みました' + loadedSerial, 'success');
    updatePreview();
}

function showQrPasswordPrompt() {
    const modal = document.getElementById('passwordModal');
    const overlay = document.getElementById('overlay');
    const input = document.getElementById('qrPasswordInput');
    const error = document.getElementById('qrPasswordError');

    document.getElementById('sideMenu').classList.remove('active');
    document.getElementById('historyModal').classList.remove('active');

    if (error) {
        error.hidden = true;
    }
    if (input) {
        input.value = '';
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');

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
    if (error) error.hidden = true;
    if (input) input.value = '';

    // 履歴やサイドメニューが開いていなければオーバーレイも閉じる
    if (!document.getElementById('historyModal').classList.contains('active') &&
        !document.getElementById('sideMenu').classList.contains('active')) {
        overlay.classList.remove('active');
    }
}

function submitQrPasswordPrompt() {
    const input = document.getElementById('qrPasswordInput');
    const error = document.getElementById('qrPasswordError');
    const entered = input ? input.value.trim() : '';

    if (entered !== QR_LOAD_PASSWORD) {
        if (error) error.hidden = false;
        if (input) {
            input.value = '';
            input.focus();
        }
        return;
    }

    const payload = pendingQrPayload;
    pendingQrPayload = null;
    hideQrPasswordPrompt();
    clearUrlParams();
    applyQrPayload(payload);
}

function cancelQrPasswordPrompt() {
    pendingQrPayload = null;
    hideQrPasswordPrompt();
    clearUrlParams();
    showMessage('QRコードの読み込みをキャンセルしました', 'success');
}

// URLパラメータから値札データを読み込む
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

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

    // パラメータが存在する場合のみ読み込む
    if (serialNumber || modelNumber || category || operation ||
        purchasePrice || batteryCost || beltCost || desiredPrice) {
        console.log('URLパラメータから値札データを読み込みます（パスワード確認待ち）');

        pendingQrPayload = {
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

        // 認証前に値札内容を画面へ出さない。正しいパスワード入力後に反映する
        showQrPasswordPrompt();
    }
}

// 履歴に保存
function saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    try {
        const history = getHistory();
        
        const historyItem = {
            date: new Date().toISOString(),
            serialNumber: serialNumber,
            category: category || '',
            modelNumber: modelNumber,
            operation: operation || '',
            purchasePrice: purchasePrice || '',
            batteryCost: batteryCost || '',
            beltCost: beltCost || '',
            desiredPrice: desiredPrice
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
    
    // 履歴を読み込んで表示（非同期的に処理）
    setTimeout(() => {
        const history = getHistory();
        
        if (history.length === 0) {
            historyList.innerHTML = '<p class="no-history">履歴がありません</p>';
        } else {
            // DocumentFragmentを使用してパフォーマンス向上
            const fragment = document.createDocumentFragment();
            
            history.forEach((item, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'history-item-wrapper';
                wrapper.dataset.index = index; // インデックスをdata属性に保存
                
                const container = document.createElement('div');
                container.className = 'history-item-container';
                
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
                
                // 削除ボタン
                const deleteButton = document.createElement('div');
                deleteButton.className = 'delete-button';
                deleteButton.textContent = '削除';
                
                container.appendChild(historyItem);
                wrapper.appendChild(container);
                wrapper.appendChild(deleteButton);
                fragment.appendChild(wrapper);
            });
            
            // 一括でDOMに追加（パフォーマンス向上）
            historyList.innerHTML = '';
            historyList.appendChild(fragment);
            
            // イベント委譲を使用（各要素に個別リスナーを追加しない）
            setupHistoryEventDelegation(historyList, history);
        }
    }, 0);
}

// 履歴リストのイベント委譲設定（パフォーマンス最適化）
function setupHistoryEventDelegation(historyList, history) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let isHorizontalSwipe = null; // スワイプ方向を判定
    let activeItem = null;
    let activeContainer = null;
    
    historyList.addEventListener('touchstart', function(e) {
        const historyItem = e.target.closest('.history-item');
        if (!historyItem) return;
        
        activeItem = historyItem;
        activeContainer = historyItem.closest('.history-item-container');
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentX = startX;
        currentY = startY;
        isDragging = true;
        isHorizontalSwipe = null; // リセット
        historyItem.classList.add('swiping');
    }, {passive: true});
    
    historyList.addEventListener('touchmove', function(e) {
        if (!isDragging || !activeContainer) return;
        
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        // 初回のみスワイプ方向を判定
        if (isHorizontalSwipe === null) {
            // 横方向の動きが縦方向より大きければ横スワイプと判定
            isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        }
        
        // 横スワイプの場合のみスワイプ処理を実行
        if (isHorizontalSwipe) {
            // 左にスワイプした場合のみ
            if (deltaX < 0) {
                e.preventDefault(); // 横スワイプ時のみスクロールを防止
                const moveX = Math.max(deltaX, -80);
                activeContainer.style.transform = `translateX(${moveX}px)`;
            }
        }
        // 縦スワイプの場合は何もせず、通常のスクロールを許可
    });
    
    historyList.addEventListener('touchend', function(e) {
        if (!isDragging || !activeItem || !activeContainer) return;
        isDragging = false;
        activeItem.classList.remove('swiping');
        
        const deltaX = currentX - startX;
        
        // 横スワイプだった場合のみスワイプアクションを実行
        if (isHorizontalSwipe && deltaX < -40) {
            activeContainer.style.transform = 'translateX(-80px)';
        } else if (isHorizontalSwipe) {
            activeContainer.style.transform = 'translateX(0)';
        }
        
        activeItem = null;
        activeContainer = null;
        isHorizontalSwipe = null;
    }, {passive: true});
    
    // クリックイベント（委譲）
    historyList.addEventListener('click', function(e) {
        // 削除ボタンクリック
        if (e.target.classList.contains('delete-button')) {
            const wrapper = e.target.closest('.history-item-wrapper');
            const index = parseInt(wrapper.dataset.index);
            if (confirm('この履歴を削除しますか？')) {
                deleteHistoryItem(index);
                showHistoryModal(); // 再読み込み
            }
            return;
        }
        
        // 履歴アイテムクリック
        const historyItem = e.target.closest('.history-item');
        if (historyItem) {
            const container = historyItem.closest('.history-item-container');
            // スワイプ中はクリックを無効化
            if (container.style.transform && container.style.transform !== 'translateX(0px)') {
                container.style.transform = 'translateX(0)';
                return;
            }
            
            const wrapper = historyItem.closest('.history-item-wrapper');
            const index = parseInt(wrapper.dataset.index);
            loadFromHistory(history[index]);
            closeHistoryModal();
        }
    });
}

// 履歴モーダルを閉じる
function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    const overlay = document.getElementById('overlay');
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
}

// 履歴からフォームに読み込む
function loadFromHistory(item) {
    document.getElementById('modelNumber').value = item.modelNumber;
    document.getElementById('purchasePrice').value = item.purchasePrice || '';
    document.getElementById('batteryCost').value = item.batteryCost || '';
    document.getElementById('beltCost').value = item.beltCost || '';
    document.getElementById('desiredPrice').value = item.desiredPrice;
    
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
    
    updatePreview();
    showMessage('履歴から値札データを読み込みました', 'success');
}
