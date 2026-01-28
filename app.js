// グローバル変数
let printer = null;

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
    const currentSerial = document.getElementById('serialNumber').value;
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
    return saved || 'printassist'; // デフォルトはPrint Assist
}

function updatePrinterDisplay(printer) {
    const printAssistBtn = document.getElementById('printAssistOption');
    const tmAssistantBtn = document.getElementById('tmAssistantOption');
    const printerInfo = document.getElementById('printerInfo');
    
    if (printer === 'printassist') {
        printAssistBtn.classList.add('active');
        tmAssistantBtn.classList.remove('active');
        printerInfo.textContent = '現在: Print Assist';
    } else {
        tmAssistantBtn.classList.add('active');
        printAssistBtn.classList.remove('active');
        printerInfo.textContent = '現在: TM Assistant';
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // URLパラメータから値札データを読み込む
    loadFromURL();
    
    // 保存された連番を読み込む（内部管理のみ）
    const savedSerial = loadSerialNumber();
    console.log('保存された連番を読み込みました:', savedSerial);
    
    // 保存されたプリンター選択を読み込む
    const savedPrinter = loadPrinterSelection();
    updatePrinterDisplay(savedPrinter);
    console.log('保存されたプリンター選択を読み込みました:', savedPrinter);
    
    // プリンター選択ボタン
    document.getElementById('printAssistOption').addEventListener('click', function() {
        savePrinterSelection('printassist');
        updatePrinterDisplay('printassist');
        showMessage('プリンターをPrint Assistに設定しました', 'success');
    });
    
    document.getElementById('tmAssistantOption').addEventListener('click', function() {
        savePrinterSelection('tmassistant');
        updatePrinterDisplay('tmassistant');
        showMessage('プリンターをTM Assistantに設定しました', 'success');
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
    
    // オーバーレイクリック - サイドメニューと履歴モーダルの両方を閉じる
    overlay.addEventListener('click', function() {
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
    
    // 型番の自由編集（手動改行可能、自動改行も行う）
    modelNumberField.addEventListener('input', function(e) {
        // 17文字ごとに自動改行（手動改行も考慮）
        autoLineBreakSmart(this, 17);
        updatePreview();
    });
    
    // Enterキーで手動改行（17文字超過時は自動改行も行う）
    modelNumberField.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            // Enterキーで手動改行を許可
            return;
        }
    });
    
    // 貼り付け時に17文字で自動改行
    modelNumberField.addEventListener('paste', function(e) {
        setTimeout(() => {
            autoLineBreakForPaste(this, 17);
            updatePreview();
        }, 10);
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
        // Print Assist印刷
        console.log('Print Assist印刷を使用');
        printWithPrintAssist(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
    } else {
        // TM Assistant印刷
        console.log('TM Assistant印刷を使用');
        printWithTMAssistant(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
    }
}

// PrintAssist印刷（iPad/iPhone）
function printWithPrintAssist(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    console.log('=== PrintAssist印刷開始 ===');
    console.log('入力データ:', {serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice});
    
    // PrintAssistアプリの確認を促す
    if (confirm('PrintAssistアプリで印刷します。\n\nPrintAssistがインストールされていますか？\n\n「OK」= インストール済み（印刷実行）\n「キャンセル」= 未インストール（App Storeへ移動）')) {
        console.log('PrintAssist印刷を実行します');
    } else {
        // App Storeへ移動
        window.location.href = 'https://apps.apple.com/jp/app/epson-tm-print-assistant/id1025534382';
        showMessage('App StoreからPrintAssistをインストールしてください', 'error');
        return;
    }
    
    try {
        // 日付生成（時刻なし）
        const now = new Date();
        const dateString = `${now.getFullYear()}年${(now.getMonth()+1).toString().padStart(2,'0')}月${now.getDate().toString().padStart(2,'0')}日`;
        const qrcodeNumber = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${serialNumber.padStart(5, '0')}`;
        
        // QRコード用のデータURL生成
        const dataURL = generateDataURL(modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
        
        console.log('日時:', dateString);
        console.log('QRコード番号:', qrcodeNumber);
        console.log('データURL:', dataURL);
        
        // ePOS-Print XML生成（日本語対応、58mm用紙）
        let xml = '<?xml version="1.0" encoding="utf-8"?>';
        xml += '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">';
        xml += '<text lang="ja"/>'; // 日本語設定
        
        // ヘッダー行: T's time（左）　連番（右）- スペースで右寄せ調整
        xml += '<text width="2" height="1" em="true"/>';
        xml += '<text align="center"/>';
        const serialHalfWidth = serialNumber.padStart(5, '0');
        // 58mm用紙でwidth="2"の場合、1行約16文字
        // "T's time"（8文字）+ 3スペース + "00001"（5文字）= 16文字
        const headerLine = `T&apos;s time   ${serialHalfWidth}`;
        xml += `<text>${headerLine}&#10;&#10;</text>`;
        
        // カテゴリー表示（中央揃え）
        xml += '<text width="1" height="1" em="false"/>';
        if (category) {
            xml += `<text>${escapeXml(category)}&#10;&#10;</text>`;
        }
        
        // 型番（中央揃え・手動改行対応）
        xml += '<text align="center"/>';
        // 手動改行があればそれを尊重、なけれは17文字で自動分割
        const modelLines = modelNumber.includes('\n') 
            ? modelNumber.split('\n') 
            : splitText(modelNumber, 17);
        for (let line of modelLines) {
            xml += `<text>${escapeXml(line)}&#10;</text>`;
        }
        xml += '<text>&#10;</text>'; // 空行
        
        // 稼働方式（中央揃え）
        if (operation) {
            xml += `<text>${escapeXml(operation)}&#10;&#10;</text>`;
        }
        
        // 購入価格（入力がある場合のみ）- 「円」表記、ハイフンなし
        if (purchasePrice) {
            const priceNum = Number(purchasePrice);
            if (priceNum >= 100000) {
                // 10万以上は2行
                xml += `<text>購入価格&#10;</text>`;
                xml += `<text>${priceNum.toLocaleString()}円&#10;</text>`;
            } else {
                xml += `<text>購入価格${priceNum.toLocaleString()}円&#10;</text>`;
            }
        }
        
        // 電池代（入力がある場合のみ）- 「円」表記、ハイフンなし
        if (batteryCost) {
            xml += `<text>電池代${Number(batteryCost).toLocaleString()}円&#10;</text>`;
        }
        
        // ベルト代（入力がある場合のみ）- 「円」表記、ハイフンなし
        if (beltCost) {
            xml += `<text>ベルト代${Number(beltCost).toLocaleString()}円&#10;</text>`;
        }
        
        xml += '<text>&#10;</text>'; // 空行
        
        // 金額（希望金額）- 金額のみ表示
        const desiredNum = Number(desiredPrice);
        xml += '<text width="2" height="2" em="true"/>';
        xml += `<text>${desiredNum.toLocaleString()}円&#10;&#10;</text>`;
        
        // 注意文（トグルスイッチがONの場合のみ印刷）
        const printNotice = document.getElementById('printNotice').checked;
        if (printNotice) {
            xml += '<text width="1" height="1" em="false"/>';
            xml += '<text>﹡大幅に金額が離れている場合は&#10;</text>';
            xml += '<text>お売りする事が出来ません。&#10;</text>';
            xml += '<text>ご了承下さい。&#10;&#10;</text>';
        }
        
        // 日時
        xml += '<text width="1" height="1" em="false"/>';
        xml += `<text>${escapeXml(dateString)}&#10;&#10;</text>`;
        
        // QRコード（データURL）- サイズを小さく
        xml += `<symbol type="qrcode_model_2" level="h" width="3" height="0" size="0">${escapeXml(dataURL)}</symbol>`;
        xml += `<text>&#10;${qrcodeNumber}&#10;</text>`;
        xml += '<feed line="2"/>';
        xml += '<cut type="feed"/>';
        xml += '</epos-print>';
        
        console.log('生成されたXML:');
        console.log(xml);
        
        // PrintAssist公式の方法：XMLを直接encodeURIComponentでエンコード
        // Base64エンコードは不要！
        const encodedXML = encodeURIComponent(xml);
        console.log('URLエンコード完了');
        console.log('エンコード後の文字数:', encodedXML.length);
        console.log('エンコードデータ（最初の100文字）:', encodedXML.substring(0, 100));
        
        // URLスキーム生成（PrintAssist公式フォーマット）
        // tmprintassistant:// 形式を使用
        const success = encodeURIComponent(window.location.href);
        const printURL = `tmprintassistant://tmprintassistant.epson.com/print?success=${success}&ver=1&data-type=eposprintxml&reselect=yes&data=${encodedXML}`;
        console.log('完全なURLスキーム長:', printURL.length);
        console.log('URLスキーム（最初の200文字）:', printURL.substring(0, 200));
        
        // デバッグ用：ユーザーに表示
        showMessage(`印刷データを生成しました（XML: ${xml.length}文字）。PrintAssistを起動します...`, 'success');
        
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
            
            showMessage('PrintAssistアプリに印刷データを送信しました', 'success');
        }, 500);
        
        console.log('=== PrintAssist起動処理完了 ===');
        
        // 履歴を保存
        saveToHistory(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
        
        // 連番を自動的に1増やして保存
        const newSerial = parseInt(serialNumber) + 1;
        saveSerialNumber(newSerial);
        updateSerialDisplay();
        updatePreview();
        
        showMessage('印刷データを送信しました。連番を ' + newSerial + ' に更新しました。', 'success');
        
    } catch (error) {
        console.error('=== PrintAssist印刷エラー ===');
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
    
    // TM Assistantアプリの確認を促す
    if (confirm('TM Assistantアプリで印刷します。\n\nTM Assistantがインストールされていますか？\n\n「OK」= インストール済み（印刷実行）\n「キャンセル」= 未インストール（App Storeへ移動）')) {
        console.log('TM Assistant印刷を実行します');
    } else {
        // App Storeへ移動
        window.location.href = 'https://apps.apple.com/jp/app/epson-tm-assistant/id1300223345';
        showMessage('App StoreからTM Assistantをインストールしてください', 'error');
        return;
    }
    
    try {
        // 日付生成（時刻なし）
        const now = new Date();
        const dateString = `${now.getFullYear()}年${(now.getMonth()+1).toString().padStart(2,'0')}月${now.getDate().toString().padStart(2,'0')}日`;
        const qrcodeNumber = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${serialNumber.padStart(5, '0')}`;
        
        // QRコード用のデータURL生成
        const dataURL = generateDataURL(modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
        
        console.log('日時:', dateString);
        console.log('QRコード番号:', qrcodeNumber);
        console.log('データURL:', dataURL);
        
        // ePOS-Print XML生成（日本語対応、58mm用紙）
        let xml = '<?xml version="1.0" encoding="utf-8"?>';
        xml += '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">';
        xml += '<text lang="ja"/>'; // 日本語設定
        
        // ヘッダー行: T's time（左）　連番（右）- スペースで右寄せ調整
        xml += '<text width="2" height="1" em="true"/>';
        xml += '<text align="center"/>';
        const serialHalfWidth = serialNumber.padStart(5, '0');
        // 58mm用紙でwidth="2"の場合、1行約16文字
        // "T's time"（8文字）+ 3スペース + "00001"（5文字）= 16文字
        const headerLine = `T&apos;s time   ${serialHalfWidth}`;
        xml += `<text>${headerLine}&#10;&#10;</text>`;
        
        // カテゴリー表示（中央揃え）
        xml += '<text width="1" height="1" em="false"/>';
        if (category) {
            xml += `<text>${escapeXml(category)}&#10;&#10;</text>`;
        }
        
        // 型番（中央揃え・手動改行対応）
        xml += '<text align="center"/>';
        // 手動改行があればそれを尊重、なけれは17文字で自動分割
        const modelLines = modelNumber.includes('\n') 
            ? modelNumber.split('\n') 
            : splitText(modelNumber, 17);
        for (let line of modelLines) {
            xml += `<text>${escapeXml(line)}&#10;</text>`;
        }
        xml += '<text>&#10;</text>'; // 空行
        
        // 稼働方式（中央揃え）
        if (operation) {
            xml += `<text>${escapeXml(operation)}&#10;&#10;</text>`;
        }
        
        // 購入価格（入力がある場合のみ）- 「円」表記、ハイフンなし
        if (purchasePrice) {
            const priceNum = Number(purchasePrice);
            if (priceNum >= 100000) {
                // 10万以上は2行
                xml += `<text>購入価格&#10;</text>`;
                xml += `<text>${priceNum.toLocaleString()}円&#10;</text>`;
            } else {
                xml += `<text>購入価格${priceNum.toLocaleString()}円&#10;</text>`;
            }
        }
        
        // 電池代（入力がある場合のみ）- 「円」表記、ハイフンなし
        if (batteryCost) {
            xml += `<text>電池代${Number(batteryCost).toLocaleString()}円&#10;</text>`;
        }
        
        // ベルト代（入力がある場合のみ）- 「円」表記、ハイフンなし
        if (beltCost) {
            xml += `<text>ベルト代${Number(beltCost).toLocaleString()}円&#10;</text>`;
        }
        
        xml += '<text>&#10;</text>'; // 空行
        
        // 金額（希望金額）- 金額のみ表示
        const desiredNum = Number(desiredPrice);
        xml += '<text width="2" height="2" em="true"/>';
        xml += `<text>${desiredNum.toLocaleString()}円&#10;&#10;</text>`;
        
        // 注意文（トグルスイッチがONの場合のみ印刷）
        const printNotice = document.getElementById('printNotice').checked;
        if (printNotice) {
            xml += '<text width="1" height="1" em="false"/>';
            xml += '<text>﹡大幅に金額が離れている場合は&#10;</text>';
            xml += '<text>お売りする事が出来ません。&#10;</text>';
            xml += '<text>ご了承下さい。&#10;&#10;</text>';
        }
        
        // 日時
        xml += '<text width="1" height="1" em="false"/>';
        xml += `<text>${escapeXml(dateString)}&#10;&#10;</text>`;
        
        // QRコード（データURL）- サイズを小さく
        xml += `<symbol type="qrcode_model_2" level="h" width="3" height="0" size="0">${escapeXml(dataURL)}</symbol>`;
        xml += `<text>&#10;${qrcodeNumber}&#10;</text>`;
        xml += '<feed line="2"/>';
        xml += '<cut type="feed"/>';
        xml += '</epos-print>';
        
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

// XML特殊文字エスケープ
function escapeXml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
}

// テキストを指定文字数で分割（17文字で改行）
function splitText(text, maxLength) {
    if (!text) return [''];
    const lines = [];
    for (let i = 0; i < text.length; i += maxLength) {
        lines.push(text.substring(i, i + maxLength));
    }
    return lines;
}

// テキストエリアの自動改行処理（17文字ごと）
function autoLineBreak(textarea, maxCharsPerLine) {
    const cursorPos = textarea.selectionStart;
    let text = textarea.value.replace(/\n/g, ''); // 既存の改行を削除
    
    // 17文字ごとに改行を挿入
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

// 貼り付け時の自動改行処理（手動改行を保持しながら17文字超過行を分割）
function autoLineBreakForPaste(textarea, maxCharsPerLine) {
    const lines = textarea.value.split('\n');
    let formatted = [];
    
    for (let line of lines) {
        if (line.length > maxCharsPerLine) {
            // 17文字を超える行は分割
            for (let i = 0; i < line.length; i += maxCharsPerLine) {
                formatted.push(line.substring(i, i + maxCharsPerLine));
            }
        } else {
            formatted.push(line);
        }
    }
    
    textarea.value = formatted.join('\n');
}

// スマートな自動改行（手動改行を保持しつつ、17文字超過を自動分割）
function autoLineBreakSmart(textarea, maxCharsPerLine) {
    const cursorPos = textarea.selectionStart;
    const lines = textarea.value.split('\n');
    let formatted = [];
    let totalChars = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.length > maxCharsPerLine) {
            // 17文字を超える行は自動分割
            for (let j = 0; j < line.length; j += maxCharsPerLine) {
                formatted.push(line.substring(j, j + maxCharsPerLine));
            }
        } else {
            formatted.push(line);
        }
    }
    
    const newValue = formatted.join('\n');
    if (textarea.value !== newValue) {
        textarea.value = newValue;
        // カーソル位置を調整
        const newCursorPos = Math.min(cursorPos, newValue.length);
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    }
}

// 半角数字を全角数字に変換
function toFullWidth(str) {
    return str.replace(/[0-9]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
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
                document.getElementById('serialNumber').value = parseInt(serialNumber) + 1;
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
function generateDataURL(modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice) {
    const baseURL = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    if (modelNumber) params.append('model', modelNumber);
    if (category) params.append('category', category);
    if (operation) params.append('operation', operation);
    if (purchasePrice) params.append('price1', purchasePrice);
    if (batteryCost) params.append('price2', batteryCost);
    if (beltCost) params.append('price3', beltCost);
    if (desiredPrice) params.append('price4', desiredPrice);
    
    return baseURL + '?' + params.toString();
}

// URLパラメータから値札データを読み込む
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const modelNumber = urlParams.get('model');
    const category = urlParams.get('category');
    const operation = urlParams.get('operation');
    const purchasePrice = urlParams.get('price1');
    const batteryCost = urlParams.get('price2');
    const beltCost = urlParams.get('price3');
    const desiredPrice = urlParams.get('price4');
    
    // パラメータが存在する場合のみ読み込む
    if (modelNumber || category || operation) {
        console.log('URLパラメータから値札データを読み込みます');
        
        if (modelNumber) document.getElementById('modelNumber').value = modelNumber;
        if (purchasePrice) document.getElementById('purchasePrice').value = purchasePrice;
        if (batteryCost) document.getElementById('batteryCost').value = batteryCost;
        if (beltCost) document.getElementById('beltCost').value = beltCost;
        if (desiredPrice) document.getElementById('desiredPrice').value = desiredPrice;
        
        // カテゴリーの設定
        if (category) {
            const categorySelect = document.getElementById('categoryType');
            const categoryOptions = Array.from(categorySelect.options).map(opt => opt.value);
            
            if (categoryOptions.includes(category)) {
                categorySelect.value = category;
            } else {
                categorySelect.value = 'other';
                document.getElementById('otherCategory').value = category;
                document.getElementById('otherCategoryGroup').style.display = 'block';
            }
        }
        
        // 稼働方式の設定
        if (operation) {
            const operationSelect = document.getElementById('operationType');
            const operationOptions = Array.from(operationSelect.options).map(opt => opt.value);
            
            if (operationOptions.includes(operation)) {
                operationSelect.value = operation;
            } else {
                operationSelect.value = 'other';
                document.getElementById('otherOperation').value = operation;
                document.getElementById('otherOperationGroup').style.display = 'block';
            }
        }
        
        showMessage('QRコードから値札データを読み込みました', 'success');
        
        // URLパラメータをクリアして、再読み込み時に再度読み込まれるのを防ぐ
        const cleanURL = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
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
