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

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // 稼働方式の「その他」選択時の処理
    document.getElementById('operationType').addEventListener('change', function() {
        const otherGroup = document.getElementById('otherOperationGroup');
        if (this.value === 'その他') {
            otherGroup.style.display = 'block';
        } else {
            otherGroup.style.display = 'none';
        }
        updatePreview();
    });
    
    // 接続方法の切り替え
    document.getElementById('connectionType').addEventListener('change', function() {
        const bluetoothGroup = document.getElementById('bluetoothGroup');
        const networkGroup = document.getElementById('networkGroup');
        
        if (this.value === 'network') {
            bluetoothGroup.style.display = 'none';
            networkGroup.style.display = 'block';
        } else {
            bluetoothGroup.style.display = 'block';
            networkGroup.style.display = 'none';
        }
    });
    
    // リアルタイムプレビューの設定
    document.getElementById('serialNumber').addEventListener('input', updatePreview);
    document.getElementById('modelNumber').addEventListener('input', updatePreview);
    document.getElementById('otherOperation').addEventListener('input', updatePreview);
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

// デバイス判定関数
function isMobileDevice() {
    return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
}

// プレビュー更新関数
function updatePreview() {
    const serialNumber = document.getElementById('serialNumber').value || '1';
    const modelNumber = document.getElementById('modelNumber').value || '-';
    const operationType = document.getElementById('operationType').value;
    const otherOperation = document.getElementById('otherOperation').value;
    const purchasePrice = document.getElementById('purchasePrice').value;
    const batteryCost = document.getElementById('batteryCost').value;
    const beltCost = document.getElementById('beltCost').value;
    const desiredPrice = document.getElementById('desiredPrice').value;
    
    // 稼働方式の表示
    let operationDisplay = '-';
    if (operationType === 'その他' && otherOperation) {
        operationDisplay = otherOperation;
    } else if (operationType) {
        operationDisplay = operationType;
    }
    document.getElementById('previewOperation').textContent = operationDisplay;
    
    // 連番表示（5桁）
    document.getElementById('previewSerial').textContent = serialNumber.padStart(5, '0');
    
    // 型番表示（自動改行）
    document.getElementById('previewModel').textContent = modelNumber;
    
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
    const operationType = document.getElementById('operationType').value;
    const otherOperation = document.getElementById('otherOperation').value;
    const purchasePrice = document.getElementById('purchasePrice').value;
    const batteryCost = document.getElementById('batteryCost').value;
    const beltCost = document.getElementById('beltCost').value;
    const desiredPrice = document.getElementById('desiredPrice').value;
    const printerIP = document.getElementById('printerIP') ? document.getElementById('printerIP').value : '';
    
    // 入力チェック（型番と希望金額のみ必須）
    if (!modelNumber || !desiredPrice) {
        showMessage('必須項目（型番、希望金額）を入力してください', 'error');
        return;
    }
    
    // 稼働方式の取得
    let operation = '';
    if (operationType === 'その他' && otherOperation) {
        operation = otherOperation;
    } else if (operationType) {
        operation = operationType;
    }
    
    // デバイスに応じた印刷処理
    if (isMobileDevice()) {
        // iPad/iPhone: PrintAssist経由（SDKチェック不要）
        console.log('モバイルデバイスを検出: PrintAssist印刷を使用');
        printWithPrintAssist(serialNumber, modelNumber, operation, purchasePrice, batteryCost, beltCost, desiredPrice);
    } else {
        // PC: ePOS-Print SDK
        const connectionType = document.getElementById('connectionType').value;
        const printerBT = document.getElementById('printerBT').value;
        
        // 接続方法に応じたチェック
        if (connectionType === 'bluetooth' && !printerBT) {
            showMessage('Bluetoothアドレスを入力してください', 'error');
            return;
        }
        
        if (connectionType === 'network' && !printerIP) {
            showMessage('プリンターIPアドレスを入力してください', 'error');
            return;
        }
        
        // ePOS-Print SDKの確認（PCのみ）
        if (typeof epson === 'undefined') {
            showMessage('ePOS-Print SDKが読み込まれていません。epos-2.27.0.jsが正しく配置されているか確認してください。', 'error');
            console.error('epsonオブジェクトが見つかりません');
            return;
        }
        
        // 接続方法に応じて印刷
        if (connectionType === 'bluetooth') {
            printViaBluetooth(serialNumber, modelNumber, operation, purchasePrice, batteryCost, beltCost, desiredPrice, printerBT);
        } else {
            printViaNetwork(serialNumber, modelNumber, operation, purchasePrice, batteryCost, beltCost, desiredPrice, printerIP);
        }
    }
}

// PrintAssist印刷（iPad/iPhone）
function printWithPrintAssist(serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice) {
    console.log('=== PrintAssist印刷開始 ===');
    console.log('入力データ:', {serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice});
    
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
        
        // 型番を17文字で改行（全角17文字 = 34バイト相当）
        const modelLines = [];
        for (let i = 0; i < modelNumber.length; i += 17) {
            modelLines.push(modelNumber.substring(i, i + 17));
        }
        const modelText = modelLines.join('&#10;');
        
        // 希望金額・購入金額の表示（9万以上で改行）
        const desiredPriceNum = Number(desiredPrice);
        let desiredPriceText = '';
        if (desiredPriceNum >= 90000) {
            desiredPriceText = `希望金額&#10;¥${desiredPriceNum.toLocaleString()}-`;
        } else {
            desiredPriceText = `希望金額¥${desiredPriceNum.toLocaleString()}-`;
        }
        
        // ePOS-Print XML生成（新デザイン）
        let xml = '<?xml version="1.0" encoding="utf-8"?>';
        xml += '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">';
        xml += '<text lang="ja"/>'; // 日本語設定
        xml += '<text align="center"/>';
        
        // T's time と連番（2倍幅、1倍高さ）
        xml += '<text width="2" height="1" em="true"/>';
        xml += `<text>T&apos;s time          ${serialNumber.padStart(5, '0')}&#10;&#10;</text>`;
        
        // 型番（通常サイズ、17文字で自動改行）
        xml += '<text width="1" height="1" em="false"/>';
        xml += `<text>${escapeXml(modelText)}&#10;&#10;</text>`;
        
        // 稼働方式（中央揃え）
        if (operationType) {
            xml += `<text>${escapeXml(operationType)}&#10;&#10;</text>`;
        }
        
        // 購入金額（入力されている場合のみ）
        if (purchasePrice) {
            const purchasePriceNum = Number(purchasePrice);
            if (purchasePriceNum >= 90000) {
                xml += `<text>購入金額&#10;¥${purchasePriceNum.toLocaleString()}-&#10;</text>`;
            } else {
                xml += `<text>購入金額¥${purchasePriceNum.toLocaleString()}-&#10;</text>`;
            }
        }
        
        // 電池代（入力されている場合のみ）
        if (batteryCost) {
            xml += `<text>  電池代¥${Number(batteryCost).toLocaleString()}-&#10;</text>`;
        }
        
        // ベルト代（入力されている場合のみ）
        if (beltCost) {
            xml += `<text>ベルト代¥${Number(beltCost).toLocaleString()}-&#10;</text>`;
        }
        
        xml += '<text>&#10;</text>';
        
        // 希望金額（2倍サイズ）
        xml += '<text width="2" height="2" em="true"/>';
        xml += `<text>${desiredPriceText}&#10;&#10;</text>`;
        
        // 日時（通常サイズ）
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
        
        // 連番を自動的に1増やす
        setTimeout(function() {
            document.getElementById('serialNumber').value = parseInt(serialNumber) + 1;
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

// Bluetooth接続で印刷
function printViaBluetooth(serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice, printerBT) {
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
                executePrint(eposDevice, serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice);
            } else if (data === 'ERROR_TIMEOUT') {
                showMessage('Bluetooth接続タイムアウト。プリンターの電源とペアリングを確認してください。', 'error');
                console.error('タイムアウト: プリンターが見つからないか、応答していません');
                // 別の形式で再試行
                retryBluetoothConnection(eposDevice, printerBT, serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice);
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
function retryBluetoothConnection(eposDevice, printerBT, serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice) {
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
                executePrint(newDevice, serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice);
            } else {
                showMessage('Bluetooth接続に失敗。プリンターの電源・ペアリング・距離を確認してください。', 'error');
                console.error('すべての接続方法が失敗しました');
            }
        });
    }, 1000);
}

// ネットワーク接続で印刷
function printViaNetwork(serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice, printerIP) {
    showMessage('ネットワークプリンターに接続中...', 'success');
    
    try {
        const eposDevice = new epson.ePOSDevice();
        
        // ネットワーク接続
        eposDevice.connect(printerIP, 8008, function(data) {
            console.log('ネットワーク接続結果:', data);
            
            if (data === 'OK' || data === 'SSL_CONNECT_OK') {
                showMessage('プリンターに接続しました。印刷データ送信中...', 'success');
                executePrint(eposDevice, serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice);
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
function executePrint(eposDevice, serialNumber, modelNumber, operationType, purchasePrice, batteryCost, beltCost, desiredPrice) {
    eposDevice.createDevice('local_printer', eposDevice.DEVICE_TYPE_PRINTER,
        {'crypto': false, 'buffer': false},
        function(devobj, retcode) {
            if (retcode === 'OK') {
                const printerObj = devobj;
                
                // 日時生成
                const now = new Date();
                const dateString = `${now.getFullYear()}年${(now.getMonth()+1).toString().padStart(2,'0')}月${now.getDate().toString().padStart(2,'0')}日 ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} ${now.getSeconds().toString().padStart(2,'0')}秒`;
                const qrcodeNumber = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${serialNumber.padStart(5, '0')}`;
                
                // 日本語設定
                printerObj.addTextLang(printerObj.LANG_JA);
                printerObj.addTextAlign(printerObj.ALIGN_CENTER);
                
                // T's time と連番（2倍幅、1倍高さ）
                printerObj.addTextStyle(false, false, true, printerObj.COLOR_1);
                printerObj.addTextSize(2, 1);
                printerObj.addText(`T's time          ${serialNumber.padStart(5, '0')}\n\n`);
                
                // 型番（通常サイズ、17文字で自動改行）
                printerObj.addTextSize(1, 1);
                printerObj.addTextStyle(false, false, false, printerObj.COLOR_1);
                const modelLines = [];
                for (let i = 0; i < modelNumber.length; i += 17) {
                    modelLines.push(modelNumber.substring(i, i + 17));
                }
                printerObj.addText(modelLines.join('\n') + '\n\n');
                
                // 稼働方式（中央揃え）
                if (operationType) {
                    printerObj.addText(`${operationType}\n\n`);
                }
                
                // 購入金額（入力されている場合のみ、9万以上で改行）
                if (purchasePrice) {
                    const purchasePriceNum = Number(purchasePrice);
                    if (purchasePriceNum >= 90000) {
                        printerObj.addText(`購入金額\n¥${purchasePriceNum.toLocaleString()}-\n`);
                    } else {
                        printerObj.addText(`購入金額¥${purchasePriceNum.toLocaleString()}-\n`);
                    }
                }
                
                // 電池代（入力されている場合のみ）
                if (batteryCost) {
                    printerObj.addText(`  電池代¥${Number(batteryCost).toLocaleString()}-\n`);
                }
                
                // ベルト代（入力されている場合のみ）
                if (beltCost) {
                    printerObj.addText(`ベルト代¥${Number(beltCost).toLocaleString()}-\n`);
                }
                
                printerObj.addText('\n');
                
                // 希望金額（2倍サイズ、9万以上で改行）
                printerObj.addTextSize(2, 2);
                printerObj.addTextStyle(false, false, true, printerObj.COLOR_1);
                const desiredPriceNum = Number(desiredPrice);
                if (desiredPriceNum >= 90000) {
                    printerObj.addText(`希望金額\n¥${desiredPriceNum.toLocaleString()}-\n\n`);
                } else {
                    printerObj.addText(`希望金額¥${desiredPriceNum.toLocaleString()}-\n\n`);
                }
                
                // 日時（通常サイズ）
                printerObj.addTextSize(1, 1);
                printerObj.addTextStyle(false, false, false, printerObj.COLOR_1);
                printerObj.addText(`${dateString}\n\n`);
                
                // QRコード
                printerObj.addSymbol(qrcodeNumber, printerObj.SYMBOL_QRCODE_MODEL_2, printerObj.LEVEL_H, 5, 0, 0);
                printerObj.addText(`\n${qrcodeNumber}\n`);
                
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
