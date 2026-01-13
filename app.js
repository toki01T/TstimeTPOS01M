// グローバル変数
let printer = null;

// デバイス判定関数
function isMobileDevice() {
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(ua);
    console.log('User Agent:', ua);
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

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // 保存された連番を読み込む
    const savedSerial = loadSerialNumber();
    document.getElementById('serialNumber').value = savedSerial;
    console.log('保存された連番を読み込みました:', savedSerial);
    
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
    
    overlay.addEventListener('click', function() {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    // 連番設定ボタン
    document.getElementById('setSerialNumber').addEventListener('click', function() {
        const newSerial = document.getElementById('menuSerialNumber').value;
        if (newSerial && parseInt(newSerial) > 0) {
            document.getElementById('serialNumber').value = newSerial;
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
            document.getElementById('serialNumber').value = 1;
            saveSerialNumber(1);
            updateSerialDisplay();
            updatePreview();
            showMessage('連番を1にリセットしました', 'success');
        }
    });
    
    // 連番が変更されたら自動保存
    document.getElementById('serialNumber').addEventListener('change', function() {
        saveSerialNumber(this.value);
        updateSerialDisplay();
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
    document.getElementById('serialNumber').addEventListener('input', updatePreview);
    document.getElementById('modelNumber').addEventListener('input', updatePreview);
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

// プレビュー更新関数
function updatePreview() {
    const serialNumber = document.getElementById('serialNumber').value || '1';
    const modelNumber = document.getElementById('modelNumber').value || '-';
    const categoryType = document.getElementById('categoryType').value;
    const otherCategory = document.getElementById('otherCategory').value;
    const operationType = document.getElementById('operationType').value;
    const otherOperation = document.getElementById('otherOperation').value;
    const purchasePrice = document.getElementById('purchasePrice').value;
    const batteryCost = document.getElementById('batteryCost').value;
    const beltCost = document.getElementById('beltCost').value;
    const desiredPrice = document.getElementById('desiredPrice').value;
    
    // 連番表示（5桁）
    document.getElementById('previewSerial').textContent = serialNumber.padStart(5, '0');
    
    // カテゴリー表示
    let categoryText = '-';
    if (categoryType === 'other' && otherCategory) {
        categoryText = otherCategory;
    } else if (categoryType !== 'other') {
        categoryText = categoryType;
    }
    document.getElementById('previewCategory').textContent = categoryText;
    
    // 型番表示（17文字で改行）
    document.getElementById('previewModel').textContent = modelNumber;
    
    // 稼働方式表示
    let operationText = '-';
    if (operationType === 'other' && otherOperation) {
        operationText = otherOperation;
    } else if (operationType !== 'other') {
        operationText = operationType;
    }
    document.getElementById('previewOperation').textContent = operationText;
    
    // 価格表示
    document.getElementById('previewPurchase').textContent = purchasePrice ? `¥${Number(purchasePrice).toLocaleString()}-` : '¥-';
    document.getElementById('previewBattery').textContent = batteryCost ? `¥${Number(batteryCost).toLocaleString()}-` : '¥-';
    document.getElementById('previewBelt').textContent = beltCost ? `¥${Number(beltCost).toLocaleString()}-` : '¥-';
    document.getElementById('previewPrice').textContent = desiredPrice ? `¥${Number(desiredPrice).toLocaleString()}-` : '¥-';
    
    // 日時表示（秒を含む）
    const now = new Date();
    const dateString = `${now.getFullYear()}年${(now.getMonth()+1).toString().padStart(2,'0')}月${now.getDate().toString().padStart(2,'0')}日 ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} ${now.getSeconds().toString().padStart(2,'0')}秒`;
    document.getElementById('previewDate').textContent = dateString;
    
    // バーコード番号生成（YYYYMMDD + 連番5桁）
    const barcodeNumber = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${serialNumber.padStart(5, '0')}`;
    document.getElementById('barcodeText').textContent = barcodeNumber;
    
    // バーコード生成
    generateBarcode(barcodeNumber);
}

// バーコード生成関数（シンプルなバー表示）
function generateBarcode(text) {
    const svg = document.getElementById('barcode');
    svg.innerHTML = '';
    
    if (!text || text === '-') return;
    
    // SVG設定
    svg.setAttribute('width', '250');
    svg.setAttribute('height', '80');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // シンプルなバーコード風表示
    const barWidth = 3;
    const spacing = 2;
    let x = 10;
    
    for (let i = 0; i < text.length; i++) {
        const digit = parseInt(text[i]);
        const height = 40 + (digit * 3);
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', 10);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', '#000');
        svg.appendChild(rect);
        
        x += barWidth + spacing;
    }
}

// 印刷関数
function printLabel() {
    const serialNumber = document.getElementById('serialNumber').value;
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
    
    // デバイスに応じた印刷処理
    if (isMobileDevice()) {
        // iPad/iPhone: PrintAssist経由
        console.log('モバイルデバイスを検出: PrintAssist印刷を使用');
        printWithPrintAssist(serialNumber, modelNumber, category, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
    } else {
        // PC: ePOS-Print SDK - 現在はモバイル専用のため警告
        showMessage('このアプリはiPad/iPhone専用です。モバイルデバイスで開いてください。', 'error');
        return;
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
        // 日時生成
        const now = new Date();
        const dateString = `${now.getFullYear()}年${(now.getMonth()+1).toString().padStart(2,'0')}月${now.getDate().toString().padStart(2,'0')}日 ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} ${now.getSeconds().toString().padStart(2,'0')}秒`;
        const qrcodeNumber = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${serialNumber.padStart(5, '0')}`;
        
        console.log('日時:', dateString);
        console.log('QRコード番号:', qrcodeNumber);
        
        // ePOS-Print XML生成（日本語対応、58mm用紙）
        let xml = '<?xml version="1.0" encoding="utf-8"?>';
        xml += '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">';
        xml += '<text lang="ja"/>'; // 日本語設定
        xml += '<text align="center"/>';
        
        // ヘッダー行: T's time（半角）　連番（全角）
        xml += '<text width="2" height="1" em="true"/>';
        const serialFullWidth = toFullWidth(serialNumber.padStart(5, '0'));
        xml += `<text>T&apos;s time   ${serialFullWidth}&#10;&#10;</text>`;
        
        // カテゴリー表示（中央揃え）
        xml += '<text width="1" height="1" em="false"/>';
        if (category) {
            xml += `<text>${escapeXml(category)}&#10;&#10;</text>`;
        }
        
        // 型番（17文字で自動改行）
        const modelLines = splitText(modelNumber, 17);
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
        
        // 希望金額（9万以上で2行）- 「円」表記、ハイフンなし
        const desiredNum = Number(desiredPrice);
        xml += '<text width="2" height="2" em="true"/>';
        if (desiredNum >= 90000) {
            xml += `<text>希望金額&#10;</text>`;
            xml += `<text>${desiredNum.toLocaleString()}円&#10;&#10;</text>`;
        } else {
            xml += `<text>希望金額${desiredNum.toLocaleString()}円&#10;&#10;</text>`;
        }
        
        // 日時
        xml += '<text width="1" height="1" em="false"/>';
        xml += `<text>${escapeXml(dateString)}&#10;&#10;</text>`;
        
        // QRコード
        xml += `<symbol type="qrcode_model_2" level="h" width="5" height="0" size="0">${qrcodeNumber}</symbol>`;
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
        
        // 連番を自動的に1増やして保存
        setTimeout(function() {
            const newSerial = parseInt(serialNumber) + 1;
            document.getElementById('serialNumber').value = newSerial;
            saveSerialNumber(newSerial);
            updateSerialDisplay();
            updatePreview();
            showMessage('印刷データを送信しました。PrintAssistアプリで確認してください。', 'success');
        }, 2000);
        
    } catch (error) {
        console.error('=== PrintAssist印刷エラー ===');
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
