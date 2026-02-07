// ไฟล์: js/utils.js
// ฟังก์ชันช่วยเหลือทั่วไป (Utility Functions)

// ========================================
// WEBAUTHN HELPERS
// ========================================
// --- WebAuthn Helpers ---
// แปลง ArrayBuffer เป็น Base64URL string
function bufferToBase64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (const charCode of bytes) {
        str += String.fromCharCode(charCode);
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// แปลง Base64URL string กลับเป็น Uint8Array
function base64urlToBuffer(base64url) {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// ========================================
// FONT UTILITIES
// ========================================
// ฟังก์ชันช่วย: เปลี่ยนขนาด Font และบันทึก
function updateAppFont(index) {
    if (!fontSettings[index]) return;
    // เปลี่ยนที่ html tag เพื่อให้ทั้งแอปขยายตาม
    document.documentElement.style.fontSize = fontSettings[index].size;
    localStorage.setItem('appFontIndex', index);
}

// ฟังก์ชันช่วย: อัปเดตข้อความป้ายกำกับ (เช่น "ปกติ", "ใหญ่")
function updateFontLabel(index) {
    const labelDisplay = document.getElementById('fontLabelDisplay');
    if (labelDisplay && fontSettings[index]) {
        labelDisplay.innerText = fontSettings[index].label;
    }
}

// ========================================
// FORMATTING UTILITIES
// ========================================
            function formatCurrency(num) {
                if (typeof num !== 'number' || isNaN(num)) {
                    num = 0;
                }
                return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 }).format(num).replace('฿', '฿');
            }

            function escapeHTML(str) {
                if (str === null || str === undefined) return '';
                return String(str).replace(/[&<>"']/g, function(m) {
                    return {
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#39;'
                    }[m];
                });
            }

            function formatTxDetails(tx) {
                if (!tx) return '<span>[ข้อมูลเสียหาย]</span>';
                const dateStr = new Date(tx.date).toLocaleString('th-TH', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const fromAccount = state.accounts.find(a => a.id === tx.accountId);
                const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
                const fromAccName = fromAccount ? escapeHTML(fromAccount.name) : 'N/A';
                const toAccName = toAccount ? escapeHTML(toAccount.name) : 'N/A';

                let detailsHtml;
                
				if (tx.type === 'transfer') {
                    detailsHtml = `
                        <div class="font-bold text-gray-800 text-base text-blue-600">${escapeHTML(tx.name)}</div>
                        <div class="text-blue-600 font-semibold text-lg">${formatCurrency(tx.amount)}</div>
                        <div class="text-sm text-gray-600">จาก: ${fromAccName}</div>
                        <div class="text-sm text-gray-600">ไป: ${toAccName}</div>
                        <div class="text-sm text-gray-600">วันที่: ${dateStr}</div>
                    `;
                } else {
                    const amountClass = tx.type === 'income' ? 'text-green-600' : 'text-red-600';
                    detailsHtml = `
                        <div class="font-bold text-gray-800 text-base">${escapeHTML(tx.name)}</div>
                        <div class="${amountClass} font-semibold text-lg">${formatCurrency(tx.amount)}</div>
                        <div class="text-sm text-gray-600">หมวดหมู่: ${escapeHTML(tx.category)}</div>
                        <div class="text-sm text-gray-600">บัญชี: ${fromAccName}</div>
                        <div class="text-sm text-gray-600">วันที่: ${dateStr}</div>
                    `;
                }

                return `<div class="flex flex-col gap-1 text-left">${detailsHtml}</div>`;
            }

            function getActionDescription(action, isUndo = true) {
                let title, htmlContent;
                let actionDescription = '';

                if (isUndo) {
                    title = 'ย้อนกลับ รายการแก้ไขล่าสุด';
                } else {
                    title = 'ทำซ้ำ รายการล่าสุด';
                }


                try {
                    switch (action.type) {
                        case 'tx-add':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-green-600">เพิ่ม</strong> รายการนี้ (ซึ่งจะลบออก):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-green-600">เพิ่ม</strong> รายการนี้:';
                            htmlContent = `<div class="mb-3">${actionDescription}</div>` + formatTxDetails(action.data);
                            break;
                        case 'tx-delete':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-red-600">ลบ</strong> รายการนี้ (ซึ่งจะเพิ่มกลับมา):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-red-600">ลบ</strong> รายการนี้:';
                            htmlContent = `<div class="mb-3">${actionDescription}</div>` + formatTxDetails(action.data);
                            break;
                        case 'tx-edit':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-blue-600">แก้ไข</strong> รายการนี้:' : 'คุณกำลังจะทำซ้ำการ <strong class="text-blue-600">แก้ไข</strong> รายการนี้:';
                            const fromDetails = formatTxDetails(isUndo ? action.newData : action.oldData);
                            const toDetails = formatTxDetails(isUndo ? action.oldData : action.newData);
                            htmlContent = `
                                <div class="mb-3">${actionDescription}</div>
                                <div class="text-center w-full max-w-md mx-auto space-y-3">
                                 <div>
                                        <strong class="text-sm font-medium text-gray-700">จาก:</strong>
                                        <div class="p-3 bg-gray-100 border rounded-lg mt-1">${fromDetails}</div>
                                    </div>
                                    <div>
                                 <strong class="text-sm font-medium text-gray-700">เป็น:</strong>
                                        <div class="p-3 bg-gray-100 border rounded-lg mt-1">${toDetails}</div>
                                 </div>
                                </div>
                            `;
                            break;
                        case 'cat-add':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-green-600">เพิ่ม</strong> หมวดหมู่นี้ (ซึ่งจะลบออก):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-green-600">เพิ่ม</strong> หมวดหมู่นี้:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.name)}</b>`;
                            break;
                        case 'cat-delete':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-red-600">ลบ</strong> หมวดหมู่นี้ (ซึ่งจะเพิ่มกลับมา):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-red-600">ลบ</strong> หมวดหมู่นี้:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.name)}</b>`;
                            break;
                        case 'item-add':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-green-600">เพิ่ม</strong> รายการที่ใช้บ่อย (ซึ่งจะลบออก):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-green-600">เพิ่ม</strong> รายการที่ใช้บ่อย:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.name)}</b>`;
                            break;
                        case 'item-delete':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-red-600">ลบ</strong> รายการที่ใช้บ่อย (ซึ่งจะเพิ่มกลับมา):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-red-600">ลบ</strong> รายการที่ใช้บ่อย:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.name)}</b>`;
                            break;
                        case 'account-add':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-green-600">เพิ่ม</strong> บัญชีนี้ (ซึ่งจะลบออก):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-green-600">เพิ่ม</strong> บัญชีนี้:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.data.name)}</b>`;
                            break;
                        case 'account-delete':
                             actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-red-600">ลบ</strong> บัญชีนี้ (ซึ่งจะเพิ่มกลับมา):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-red-600">ลบ</strong> บัญชีนี้:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.data.name)}</b>`;
                            break;
                        case 'account-edit':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-blue-600">แก้ไข</strong> บัญชีนี้:' : 'คุณกำลังจะทำซ้ำการ <strong class="text-blue-600">แก้ไข</strong> บัญชีนี้:';
                            const oldAccName = (isUndo ? action.newData : action.oldData).name;
                            const newAccName = (isUndo ? action.oldData : action.newData).name;
                            htmlContent = `
                                <div class="mb-3">${actionDescription}</div>
                                <div class="text-center w-full max-w-md mx-auto space-y-3">
                                 <div>
                                        <strong class="text-sm font-medium text-gray-700">จาก:</strong>
                                        <div class="p-3 bg-gray-100 border rounded-lg mt-1"><b class="text-purple-600 text-lg">${escapeHTML(oldAccName)}</b></div>
                                    </div>
                                    <div>
                                 <strong class="text-sm font-medium text-gray-700">เป็น:</strong>
                                        <div class="p-3 bg-gray-100 border rounded-lg mt-1"><b class="text-purple-600 text-lg">${escapeHTML(newAccName)}</b></div>
                                 </div>
                                </div>
                            `;
                            break;
                        case 'account-move':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-blue-600">สลับลำดับ</strong> บัญชี:' : 'คุณกำลังจะทำซ้ำการ <strong class="text-blue-600">สลับลำดับ</strong> บัญชี:';
                            const currentAcc = state.accounts.find(a => a.id === action.currentAccountId);
                            const targetAcc = state.accounts.find(a => a.id === action.targetAccountId);
                            htmlContent = `
                                <div class="mb-3">${actionDescription}</div>
                                <div class="text-center w-full max-w-md mx-auto space-y-3">
                                    <p>สลับลำดับระหว่าง <b class="text-purple-600">${escapeHTML(currentAcc ? currentAcc.name : 'N/A')}</b> และ <b class="text-purple-600">${escapeHTML(targetAcc ? targetAcc.name : 'N/A')}</b></p>
                                </div>
                            `;
                            break;
                            
                        default:
                            return { title: 'ยืนยัน?', html: 'คุณต้องการดำเนินการนี้ใช่หรือไม่?'
                            };
                    }
                    return { title, html: htmlContent };
                } catch (e) {
                    console.error("Error generating action description:", e, action);
                    return { title: 'ยืนยัน?', html: 'คุณต้องการดำเนินการนี้ใช่หรือไม่?' };
                }
            }

            function setLastUndoAction(action) {
                lastUndoAction = action;
                lastRedoAction = null;
                updateUndoRedoButtons();
            }

            function updateUndoRedoButtons() {
                const getEl = (id) => document.getElementById(id);
                getEl('btn-undo').disabled = !lastUndoAction;
                getEl('btn-redo').disabled = !lastRedoAction;
            }

            async function handleUndo() {


// ========================================
// TOAST NOTIFICATION
// ========================================
				function showToast(title, icon = 'success') {
					// เช็ค Dark Mode จากตัวแปร state ที่มีอยู่แล้วในไฟล์
					const isDark = state.isDarkMode; 

					const Toast = Swal.mixin({
						toast: true,
						// กำหนดตำแหน่งเป็น 'ซ้ายบน'
						position: 'top-start', 
						
						showConfirmButton: false,
						timer: 1500,
						timerProgressBar: true,
						
						// ปรับธีมสีให้เข้ากับแอป
						background: isDark ? '#1a1a1a' : '#ffffff',
						color: isDark ? '#e5e7eb' : '#1f2937',
						iconColor: icon === 'success' ? '#10b981' : (icon === 'error' ? '#ef4444' : '#3b82f6'),
						
						// ใช้ Tailwind Class ตกแต่ง (มุมโค้ง, เงา, ฟอนต์)
						customClass: {
							popup: 'rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 font-prompt mt-16 ml-2', // mt-16 เพื่อหลบ Header ด้านบนนิดนึง
							title: 'text-sm font-medium'
						},
						
						didOpen: (toast) => {
							toast.addEventListener('mouseenter', Swal.stopTimer)
							toast.addEventListener('mouseleave', Swal.resumeTimer)
						}
					});

					Toast.fire({
						icon: icon,
						title: title
					});
				}


// ========================================
// EXPORT EXCEL FUNCTION
// ========================================
    function exportAccountExcel(accountId) {
        // ตรวจสอบว่าโหลด Library มาหรือยัง
        if (typeof XLSX === 'undefined') {
            Swal.fire('Error', 'ไม่พบ Library สำหรับสร้าง Excel (กรุณาตรวจสอบ index.html)', 'error');
            return;
        }

        const account = state.accounts.find(a => a.id === accountId);
        if (!account) return;

        const txs = state.transactions.filter(t => t.accountId === accountId || t.toAccountId === accountId);
        
        if (txs.length === 0) {
            Swal.fire('ไม่มีข้อมูล', 'บัญชีนี้ยังไม่มีรายการธุรกรรมให้ดาวน์โหลด', 'info');
            return;
        }

        // เรียงวันที่เก่า -> ใหม่
        txs.sort((a, b) => new Date(a.date) - new Date(b.date));

        // --- ส่วนที่เพิ่ม: คำนวณยอดรวม ---
        let totalIncome = 0;
        let totalExpense = 0;
        let totalTransferIn = 0;
        let totalTransferOut = 0;

        // เตรียมข้อมูลรายการ (Data Rows)
        const dataRows = txs.map(tx => {
            const d = new Date(tx.date);
            const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            
            let typeStr = tx.type;
            let amount = tx.amount;
            let category = tx.category;

            // จัดการประเภท, ยอดเงิน และบวกยอดรวม
            if (tx.type === 'transfer') {
                if (tx.accountId === accountId) {
                    typeStr = 'โอนออก';
                    amount = -Math.abs(amount);
                    category = 'โอนไปยัง ' + (state.accounts.find(a => a.id === tx.toAccountId)?.name || 'N/A');
                    totalTransferOut += Math.abs(tx.amount);
                } else {
                    typeStr = 'รับโอน';
                    amount = Math.abs(amount);
                    category = 'รับโอนจาก ' + (state.accounts.find(a => a.id === tx.accountId)?.name || 'N/A');
                    totalTransferIn += Math.abs(tx.amount);
                }
            } else if (tx.type === 'expense') {
                typeStr = 'รายจ่าย';
                amount = -Math.abs(amount);
                totalExpense += Math.abs(tx.amount);
            } else if (tx.type === 'income') {
                typeStr = 'รายรับ';
                amount = Math.abs(amount);
                totalIncome += Math.abs(tx.amount);
            }

            return {
                "วันที่": dateStr,
                "เวลา": timeStr,
                "ประเภท": typeStr,
                "รายการ": tx.name || '',
                "หมวดหมู่": category || '',
                "จำนวนเงิน": amount, 
                "หมายเหตุ": tx.desc || ''
            };
        });

        // --- ส่วนที่เพิ่ม: สร้างข้อมูลสรุปยอด (Summary) ---
        // เราจะสร้าง Array ของ Object เพื่อวางไว้ด้านบน
        const summaryData = [
            { "วันที่": `สรุปรายการบัญชี: ${account.name}` }, // หัวข้อ
            { "วันที่": "รวมรายรับ", "จำนวนเงิน": totalIncome },
            { "วันที่": "รวมรายจ่าย", "จำนวนเงิน": totalExpense },
            { "วันที่": "รวมรับโอน", "จำนวนเงิน": totalTransferIn },
            { "วันที่": "รวมโอนออก", "จำนวนเงิน": totalTransferOut },
            { "วันที่": "สุทธิ (รับ-จ่าย)", "จำนวนเงิน": (totalIncome + totalTransferIn) - (totalExpense + totalTransferOut) },
            { "วันที่": "" } // เว้นบรรทัดว่าง 1 บรรทัด
        ];

        // รวมข้อมูล: สรุปยอด + รายการ
        // หมายเหตุ: XLSX.utils.json_to_sheet จะใช้ Keys ของ Object แรกเป็น Header
        // ดังนั้นเราต้องจัดการให้ดี หรือใช้วิธี sheet_add_json เพื่อแปะข้อมูลต่อกัน

        // วิธีที่ง่าย: สร้าง Sheet จาก transaction ก่อน เพื่อให้ได้ Header ที่ถูกต้อง
        const ws = XLSX.utils.json_to_sheet(dataRows, { origin: "A9" }); // เริ่มที่บรรทัดที่ 9 (เว้นที่ให้สรุปยอด)

        // เขียนข้อมูลสรุปยอดทับลงไปในช่วงบรรทัดแรก (A1)
        // ใช้ array of arrays เพื่อความอิสระในการจัดวาง
        const summaryHeader = [
            [`สรุปรายการบัญชี: ${account.name}`],
            ["รายการ", "ยอดรวม (บาท)"],
            ["รายรับทั้งหมด ", totalIncome],
            ["รายจ่ายทั้งหมด ", totalExpense],
            ["รับโอน ", totalTransferIn],
            ["โอนออก ", totalTransferOut],
            ["ยอดสุทธิ", (totalIncome + totalTransferIn) - (totalExpense + totalTransferOut)],
            [] // เว้นบรรทัด
        ];

        XLSX.utils.sheet_add_aoa(ws, summaryHeader, { origin: "A1" });

        // กำหนดความกว้างคอลัมน์ (ตามที่คุณขอปรับขนาด)
        const wscols = [
            {wch: 13}, // วันที่ (12)
            {wch: 9},  // เวลา
            {wch: 10}, // ประเภท
            {wch: 15}, // รายการ (ปรับลดเหลือ 15)
            {wch: 15}, // หมวดหมู่ (ปรับลดเหลือ 15)
            {wch: 12}, // จำนวนเงิน (ปรับลดเหลือ 12)
            {wch: 45}  // หมายเหตุ
        ];
        ws['!cols'] = wscols;

        // สร้าง Workbook และเพิ่ม Sheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Statement");

        // ตั้งชื่อไฟล์
        const today = new Date();
        const dateFile = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        
        // สั่งดาวน์โหลดไฟล์ .xlsx
        XLSX.writeFile(wb, `Statement_${account.name}_${dateFile}.xlsx`);
    }



// ========================================
// GET TRANSACTIONS FOR VIEW
// ========================================
            function getTransactionsForView(source) {
                const viewMode = (source === 'home') ?
                state.homeViewMode : state.listViewMode;
                const currentDate = (source === 'home') ? state.homeCurrentDate : state.listCurrentDate;
                if (viewMode === 'all') {
                    return state.transactions;
                }
                
                const year = currentDate.slice(0, 4);
                if (viewMode === 'month') {
                    const month = currentDate.slice(5, 7);
                    return state.transactions.filter(tx => {
                        const txDate = new Date(tx.date);
                        return txDate.getFullYear() == year && (txDate.getMonth() + 1).toString().padStart(2, '0') == month;
                    });
                } else {
                    return state.transactions.filter(tx => {
                        const txDate = new Date(tx.date);
                        return txDate.getFullYear() == year;
                    
                    });
                }
            }
            


// ========================================
// UNDO/REDO FUNCTIONS
// ========================================
            function setLastUndoAction(action) {
                lastUndoAction = action;
                lastRedoAction = null;
                updateUndoRedoButtons();
            }

            function updateUndoRedoButtons() {
                const getEl = (id) => document.getElementById(id);
                getEl('btn-undo').disabled = !lastUndoAction;
                getEl('btn-redo').disabled = !lastRedoAction;
            }

            async function handleUndo() {
                if (!lastUndoAction) return;
                const action = lastUndoAction;

                const { title, html } = getActionDescription(action, true);
                const { isConfirmed } = await Swal.fire({
                    title: title,
                    html: html,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'ใช่, ย้อนกลับ',
                    cancelButtonText: 'ยกเลิก'
                });
                if (!isConfirmed) {
                    return;
                }

                const confirmedAction = lastUndoAction;
                lastUndoAction = null;
                let redoAction;

                try {
                    switch (confirmedAction.type) {
                        case 'tx-add':
                            await dbDelete(STORE_TRANSACTIONS, confirmedAction.data.id);
                            state.transactions = state.transactions.filter(tx => tx.id !== confirmedAction.data.id);
                            // ✅ แจ้งเตือน: ย้อนกลับการเพิ่ม = ลบรายการ
                            sendLineAlert(confirmedAction.data, 'delete'); 
                            redoAction = { type: 'tx-add', data: confirmedAction.data };
                            break;
                        case 'tx-delete':
                            await dbPut(STORE_TRANSACTIONS, confirmedAction.data);
                            state.transactions.push(confirmedAction.data);
                            // ✅ แจ้งเตือน: ย้อนกลับการลบ = เพิ่มรายการคืน
                            sendLineAlert(confirmedAction.data, 'add');
                            redoAction = { type: 'tx-delete', data: confirmedAction.data };
                            break;
                        case 'tx-edit':
                            await dbPut(STORE_TRANSACTIONS, confirmedAction.oldData);
                            state.transactions = state.transactions.map(tx => tx.id === confirmedAction.oldData.id ? confirmedAction.oldData : tx);
                            // ✅ แจ้งเตือน: ย้อนกลับการแก้ไข = แก้ไขกลับเป็นค่าเดิม
                            sendLineAlert(confirmedAction.oldData, 'edit');
                            redoAction = confirmedAction;
                            break;
                        // ... (เคสอื่นๆ cat-add, item-add ฯลฯ ปล่อยไว้เหมือนเดิม เพราะเราไม่แจ้งเตือนพวกนี้) ...
                        case 'cat-add':
                            state.categories[confirmedAction.catType] = state.categories[confirmedAction.catType].filter(cat => cat !== confirmedAction.name);
                            await dbPut(STORE_CATEGORIES, { type: confirmedAction.catType, items: state.categories[confirmedAction.catType] });
                            redoAction = { type: 'cat-add', catType: confirmedAction.catType, name: confirmedAction.name };
                            break;
                        case 'cat-delete':
                            state.categories[confirmedAction.catType].push(confirmedAction.name);
                            await dbPut(STORE_CATEGORIES, { type: confirmedAction.catType, items: state.categories[confirmedAction.catType] });
                            redoAction = { type: 'cat-delete', catType: confirmedAction.catType, name: confirmedAction.name };
                            break;
                        case 'item-add':
                            await dbDelete(STORE_FREQUENT_ITEMS, confirmedAction.name);
                            state.frequentItems = state.frequentItems.filter(item => item !== confirmedAction.name);
                            redoAction = { type: 'item-add', name: confirmedAction.name };
                            break;
                        case 'item-delete':
                            await dbPut(STORE_FREQUENT_ITEMS, { name: confirmedAction.name });
                            state.frequentItems.push(confirmedAction.name);
                            redoAction = { type: 'item-delete', name: confirmedAction.name };
                            break;
                        case 'account-add':
                            await dbDelete(STORE_ACCOUNTS, confirmedAction.data.id);
                            state.accounts = state.accounts.filter(acc => acc.id !== confirmedAction.data.id);
                            redoAction = { type: 'account-add', data: confirmedAction.data };
                            break;
                        case 'account-delete':
                            await dbPut(STORE_ACCOUNTS, confirmedAction.data);
                            state.accounts.push(confirmedAction.data);
                            redoAction = { type: 'account-delete', data: confirmedAction.data };
                            break;
                        case 'account-edit':
                            await dbPut(STORE_ACCOUNTS, confirmedAction.oldData);
                            state.accounts = state.accounts.map(acc => acc.id === confirmedAction.oldData.id ? confirmedAction.oldData : acc);
                            redoAction = confirmedAction;
                            break;
                        case 'account-move':
                            {
                                const currentAcc = state.accounts.find(a => a.id === confirmedAction.currentAccountId);
                                const targetAcc = state.accounts.find(a => a.id === confirmedAction.targetAccountId);
                                currentAcc.displayOrder = confirmedAction.oldCurrentOrder;
                                targetAcc.displayOrder = confirmedAction.oldTargetOrder;
                                await Promise.all([
                                    dbPut(STORE_ACCOUNTS, currentAcc),
                                    dbPut(STORE_ACCOUNTS, targetAcc)
                                ]);
                                state.accounts = state.accounts.map(acc => {
                                    if (acc.id === currentAcc.id) return currentAcc;
                                    if (acc.id === targetAcc.id) return targetAcc;
                                    return acc;
                                });
                                redoAction = confirmedAction;
                            }
                            break;
                    }

                    if (redoAction) {
                        lastRedoAction = redoAction;
                    }
                } catch (err) {
                    console.error("Undo failed:", err);
                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถย้อนกลับได้', 'error');
                    lastUndoAction = confirmedAction;
                }

                updateUndoRedoButtons();
                await refreshAllUI();
                await refreshAccountDetailModalIfOpen();
            }
			
			// ============================================
			// ฟังก์ชัน: บังคับส่งข้อมูลทั้งหมดขึ้น Cloud (Manual Force Sync)
			// ============================================
			async function handleForceSync() {
				const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อยืนยัน');
				if (!hasPermission) return;

				const result = await Swal.fire({
					title: 'ยืนยันการส่งข้อมูล?',
					text: "ระบบจะส่งข้อมูลทั้งหมดในเครื่องนี้ ไปบันทึกทับ/รวมกับข้อมูลบน Cloud",
					icon: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#f97316', // สีส้ม
					confirmButtonText: 'ใช่, ส่งข้อมูลเดี๋ยวนี้',
					cancelButtonText: 'ยกเลิก'
				});

				if (result.isConfirmed) {
					// แจ้งเตือนแบบใหม่
                showToast("กำลังทยอยส่งข้อมูล... ห้ามปิดหน้าจอ", "info");

					try {
						const collections = [
							STORE_TRANSACTIONS, 
							STORE_ACCOUNTS, 
							STORE_CATEGORIES, 
							STORE_FREQUENT_ITEMS, 
							STORE_CONFIG,
							STORE_AUTO_COMPLETE,
							STORE_RECURRING,
							STORE_BUDGETS
						];

						let totalCount = 0;

						for (const storeName of collections) {
							const items = await dbGetAll(storeName);
							if (items.length > 0) {
								// ใช้ Promise.all เพื่อยิงข้อมูลขึ้นพร้อมกัน (เร็วกว่าทำทีละตัว)
								await Promise.all(items.map(item => saveToCloud(storeName, item)));
								totalCount += items.length;
								console.log(`Uploaded ${items.length} items from ${storeName}`);
							}
						}

						Swal.fire('สำเร็จ!', `ส่งข้อมูล ${totalCount} รายการ ขึ้น Cloud เรียบร้อยแล้ว`, 'success');

					} catch (err) {
						console.error("Force Sync Error:", err);
						Swal.fire('เกิดข้อผิดพลาด', 'การส่งข้อมูลขัดข้อง: ' + err.message, 'error');
					}
				}
			}

			async function handleRedo() {
                if (!lastRedoAction) return;
                const action = lastRedoAction;

                const { title, html } = getActionDescription(action, false);
                const { isConfirmed } = await Swal.fire({
                    title: title,
                    html: html,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'ใช่, ทำซ้ำ',
                    cancelButtonText: 'ยกเลิก'
                });
                if (!isConfirmed) {
                    return;
                }

                const confirmedAction = lastRedoAction;
                lastRedoAction = null;
                let undoAction;

                try {
                    switch (confirmedAction.type) {
                        case 'tx-add':
                            await dbPut(STORE_TRANSACTIONS, confirmedAction.data);
                            state.transactions.push(confirmedAction.data);
                            // ✅ แจ้งเตือน: ทำซ้ำการเพิ่ม = เพิ่มรายการใหม่
                            sendLineAlert(confirmedAction.data, 'add');
                            undoAction = { type: 'tx-delete', data: confirmedAction.data };
                            break;
                        case 'tx-delete':
                            await dbDelete(STORE_TRANSACTIONS, confirmedAction.data.id);
                            state.transactions = state.transactions.filter(tx => tx.id !== confirmedAction.data.id);
                            // ✅ แจ้งเตือน: ทำซ้ำการลบ = ลบรายการอีกครั้ง
                            sendLineAlert(confirmedAction.data, 'delete');
                            undoAction = { type: 'tx-add', data: confirmedAction.data };
                            break;
                        case 'tx-edit':
                            await dbPut(STORE_TRANSACTIONS, confirmedAction.newData);
                            state.transactions = state.transactions.map(tx => tx.id === confirmedAction.newData.id ? confirmedAction.newData : tx);
                            // ✅ แจ้งเตือน: ทำซ้ำการแก้ไข = แก้ไขรายการอีกครั้ง
                            sendLineAlert(confirmedAction.newData, 'edit');
                            undoAction = confirmedAction;
                            break;
                        // ... (เคสอื่นๆ cat, item, account ปล่อยไว้เหมือนเดิม) ...
                        case 'cat-add':
                            state.categories[confirmedAction.catType].push(confirmedAction.name);
                            await dbPut(STORE_CATEGORIES, { type: confirmedAction.catType, items: state.categories[confirmedAction.catType] });
                            undoAction = { type: 'cat-delete', catType: confirmedAction.catType, name: confirmedAction.name };
                            break;
                        case 'cat-delete':
                            state.categories[confirmedAction.catType] = state.categories[confirmedAction.catType].filter(cat => cat !== confirmedAction.name);
                            await dbPut(STORE_CATEGORIES, { type: confirmedAction.catType, items: state.categories[confirmedAction.catType] });
                            undoAction = { type: 'cat-add', catType: confirmedAction.catType, name: confirmedAction.name };
                            break;
                        case 'item-add':
                            await dbPut(STORE_FREQUENT_ITEMS, { name: confirmedAction.name });
                            state.frequentItems.push(confirmedAction.name);
                            undoAction = { type: 'item-delete', name: confirmedAction.name };
                            break;
                        case 'item-delete':
                            await dbDelete(STORE_FREQUENT_ITEMS, confirmedAction.name);
                            state.frequentItems = state.frequentItems.filter(item => item !== confirmedAction.name);
                            undoAction = { type: 'item-add', name: confirmedAction.name };
                            break;
                        case 'account-add':
                            await dbPut(STORE_ACCOUNTS, confirmedAction.data);
                            state.accounts.push(confirmedAction.data);
                            undoAction = { type: 'account-delete', data: confirmedAction.data };
                            break;
                        case 'account-delete':
                            await dbDelete(STORE_ACCOUNTS, confirmedAction.data.id);
                            state.accounts = state.accounts.filter(acc => acc.id !== confirmedAction.data.id);
                            undoAction = { type: 'account-add', data: confirmedAction.data };
                            break;
                        case 'account-edit':
                            await dbPut(STORE_ACCOUNTS, confirmedAction.newData);
                            state.accounts = state.accounts.map(acc => acc.id === confirmedAction.newData.id ? confirmedAction.newData : acc);
                            undoAction = confirmedAction;
                            break;
                        case 'account-move':
                            {
                                const currentAcc = state.accounts.find(a => a.id === confirmedAction.currentAccountId);
                                const targetAcc = state.accounts.find(a => a.id === confirmedAction.targetAccountId);
                                currentAcc.displayOrder = confirmedAction.newCurrentOrder;
                                targetAcc.displayOrder = confirmedAction.newTargetOrder;
                                await Promise.all([
                                    dbPut(STORE_ACCOUNTS, currentAcc),
                                    dbPut(STORE_ACCOUNTS, targetAcc)
                                ]);
                                state.accounts = state.accounts.map(acc => {
                                    if (acc.id === currentAcc.id) return currentAcc;
                                    if (acc.id === targetAcc.id) return targetAcc;
                                    return acc;
                                });
                                undoAction = {
                                    type: 'account-move',
                                    currentAccountId: confirmedAction.currentAccountId,
                                    newCurrentOrder: confirmedAction.oldCurrentOrder,
                                    oldCurrentOrder: confirmedAction.newCurrentOrder,
                                    targetAccountId: confirmedAction.targetAccountId,
                                    newTargetOrder: confirmedAction.oldTargetOrder,
                                    oldTargetOrder: confirmedAction.newTargetOrder
                                };
                            }
                            break;
                    }

                    if (undoAction) {
                        lastUndoAction = undoAction;
                    }
                } catch (err) {
                    console.error("Redo failed:", err);
                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถทำซ้ำได้', 'error');
                    lastRedoAction = confirmedAction;
                }

                updateUndoRedoButtons();
                await refreshAllUI();
                await refreshAccountDetailModalIfOpen();
            }

            function parseVoiceInput(text) {
                
                text = text.trim();
                let type = 'expense'; 

                
                if (/^(รายรับ|ได้เงิน|เข้า)/.test(text)) {
                    type = 'income';
                } else if (/^(รายจ่าย|จ่าย|ซื้อ|ค่า)/.test(text)) {
                    type = 'expense';
                }
                
                const amountMatch = text.match(/([\d,]+(\.\d+)?)/);
                if (!amountMatch) {
                    console.error('VoiceParse: No amount found in text.');
                    return null; 
                }

                const amountString = amountMatch[0].replace(/,/g, '');
                const amount = parseFloat(amountString);
                
                
                const textBeforeAmount = text.substring(0, amountMatch.index).trim();
                const textAfterAmount = text.substring(amountMatch.index + amountMatch[0].length).trim();

                
                let name = textBeforeAmount;
                
                name = name.replace(/^(รายจ่าย|จ่าย|ซื้อ|ค่า|รายรับ|ได้เงิน|เข้า)\s*/, '').trim();
                name = name.replace(/^(ซื้อ|ค่า|รับเงิน|ได้)\s*/, '').trim();
                if (!name) {
                    console.warn('VoiceParse: No name found before amount. Using default.');
                    name = (type === 'income') ? 'รายรับ' : 'รายจ่าย';
                }
            
                 let description = textAfterAmount.replace(/^(บาท)\s*/, '').trim(); 
                if (description.length === 0) {
                    description = null;
                
                }
                
                return { type, name, amount, description };
            }
            
            const EXPENSE_KEYWORD_MAP = {
                'กาแฟ': 'เครื่องดื่ม', 'ชา': 'เครื่องดื่ม', 'น้ำเปล่า': 'เครื่องดื่ม', 'นม': 'เครื่องดื่ม', 'น้ำอัดลม': 'เครื่องดื่ม', 'เครื่องดื่ม': 'เครื่องดื่ม', 'คาเฟ่': 'เครื่องดื่ม',
                'ข้าว': 'อาหาร', 'ก๋วยเตี๋ยว': 'อาหาร', 'มื้อเที่ยง': 'อาหาร', 'มื้อเย็น': 'อาหาร', 'มื้อเช้า': 'อาหาร', 'ขนม': 'อาหาร', 'หมูกระทะ': 'อาหาร', 'สเต็ก': 'อาหาร', 'พิซซ่า': 'อาหาร', 'ฟาสต์ฟู้ด': 'อาหาร', 'อาหาร': 'อาหาร',
                'bts': 'เดินทาง', 'mrt': 'เดินทาง', 'รถเมล์': 'เดินทาง', 'แท็กซี่': 'เดินทาง', 'grab': 'เดินทาง', 'bolt': 'เดินทาง', 'น้ำมัน': 'เดินทาง', 'ทางด่วน': 'เดินทาง', 'วิน': 'เดินทาง', 'รถไฟ': 'เดินทาง', 'เครื่องบิน': 'เดินทาง', 'เดินทาง': 'เดินทาง',
                'สบู่': 'ของใช้ส่วนตัว', 'ยาสีฟัน': 'ของใช้ส่วนตัว', 'แชมพู': 'ของใช้ส่วนตัว', 'ครีม': 'ของใช้ส่วนตัว', 'เครื่องสำาง': 'ของใช้ส่วนตัว', 'ของใช้ส่วนตัว': 'ของใช้ส่วนตัว',
                'น้ำยาล้างจาน': 'ของใช้ในบ้าน', 'ผงซักฟอก': 'ของใช้ในบ้าน', 'ทิชชู่': 'ของใช้ในบ้าน', 'ค่าไฟ': 'ของใช้ในบ้าน', 'ค่าน้ำ': 'ของใช้ในบ้าน', 'อินเทอร์เน็ต': 'ของใช้ในบ้าน', 'ของใช้ในบ้าน': 'ของใช้ในบ้าน',
                'netflix': 'รายจ่ายอื่นๆ', 'spotify': 'รายจ่ายอื่นๆ', 'shopee': 'รายจ่ายอื่นๆ', 'lazada': 'รายจ่ายอื่นๆ', 'ค่าสมาชิก': 'รายจ่ายอื่นๆ', 'บันเทิง': 'รายจ่ายอื่นๆ', 'รายจ่ายอื่นๆ': 'รายจ่ายอื่นๆ',
            };
        
            function autoSelectCategory(name, type) {
                try {
                    if (type === 'expense') {
                        const lowerName = name.toLowerCase();
                        for (const [keyword, category] of Object.entries(EXPENSE_KEYWORD_MAP)) {
                            if (lowerName.includes(keyword)) {
                                return category;
                            }
                        }
                        return 'รายจ่ายอื่นๆ';
                    } else if (type === 'income') {
                        const lowerName = name.toLowerCase();
                        if (lowerName.includes('เงินเดือน') || lowerName.includes('salary')) {
                            return 'เงินเดือน';
                        } else if (lowerName.includes('รายได้เสริม') || lowerName.includes('ฟรีแลนซ์')) {
                            return 'รายได้เสริม';
                        } else if (lowerName.includes('ค่าคอม') || lowerName.includes('คอมมิชชั่น')) {
                            return 'ค่าคอม';
                        }
                        return 'รายได้อื่นๆ';
                    }
                    return type === 'income' ? 'รายได้อื่นๆ' : 'รายจ่ายอื่นๆ';
                } catch (e) {
                    console.error("Error in autoSelectCategory:", e);
                    return type === 'income' ? 'รายได้อื่นๆ' : 'รายจ่ายอื่นๆ';
                }
            }

            function startVoiceRecognition() {
                if (!recognition) {
                    Swal.fire('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการจดจำเสียง', 'error');
                    return;
                }

                const voiceBtn = document.getElementById('voice-add-btn');
                voiceBtn.innerHTML = '<i class="fa-solid fa-microphone-slash mr-2 fa-beat"></i> กำลังฟัง...';
                voiceBtn.disabled = true;

                recognition.start();

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    console.log('Voice transcript:', transcript);

                    const parsed = parseVoiceInput(transcript);
                    if (!parsed) {
                        Swal.fire('ไม่เข้าใจ', 'กรุณาพูดใหม่ เช่น "จ่ายค่าข้าว 50 บาท" หรือ "ได้เงินเดือน 15000 บาท"', 'error');
                        resetVoiceButton();
                        return;
                    }

                    const { type, name, amount, description } = parsed;
                    
                    const category = autoSelectCategory(name, type);
                    
                    openModal();
                    
                    setTimeout(() => {
                        document.querySelector(`input[name="tx-type"][value="${type}"]`).checked = true;
                        document.getElementById('tx-name').value = name;
                        document.getElementById('tx-amount').value = amount;
                        if (description) {
                            document.getElementById('tx-desc').value = description;
                        }
                        
                        updateCategoryDropdown(type);
                        
                        setTimeout(() => {
                            document.getElementById('tx-category').value = category;
                        }, 100);
                        
                        updateFormVisibility();
                        
                        Swal.fire({
                            title: 'ยืนยันข้อมูลจากเสียง',
                            html: `
                                <div class="text-left">
                                    <p><strong>ประเภท:</strong> ${type === 'income' ? 'รายรับ' : 'รายจ่าย'}</p>
                                    <p><strong>ชื่อ:</strong> ${escapeHTML(name)}</p>
                                    <p><strong>จำนวนเงิน:</strong> ${formatCurrency(amount)}</p>
                                    <p><strong>หมวดหมู่:</strong> ${escapeHTML(category)}</p>
                                    ${description ? `<p><strong>คำอธิบาย:</strong> ${escapeHTML(description)}</p>` : ''}
                                </div>
                            `,
                            icon: 'info',
                            showCancelButton: true,
                            confirmButtonText: 'บันทึก',
                            cancelButtonText: 'แก้ไข'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                document.getElementById('transaction-form').dispatchEvent(new Event('submit'));
                            }
                        });
                    }, 300);
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'no-speech') {
                        Swal.fire('ไม่พบเสียง', 'กรุณาพูดให้ชัดเจนขึ้น', 'warning');
                    } else {
                        Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการจดจำเสียง: ' + event.error, 'error');
                    }
                    resetVoiceButton();
                };

                recognition.onend = () => {
                    resetVoiceButton();
                };

                function resetVoiceButton() {
                    voiceBtn.innerHTML = '<i class="fa-solid fa-microphone mr-2"></i> เพิ่มด้วยเสียง';
                    voiceBtn.disabled = false;
                }
            }
			// [script.js] แก้ไขฟังก์ชัน startModalVoiceRecognition ให้ทำงานเสถียรขึ้น
				function startModalVoiceRecognition() {
					if (!recognition) {
						Swal.fire('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการจดจำเสียง', 'error');
						return;
					}

					const btn = document.getElementById('modal-voice-btn');
					const originalIcon = '<i class="fa-solid fa-microphone text-xl"></i>';
					
					// ฟังก์ชันสำหรับคืนค่าปุ่ม (ใช้ร่วมกันทั้งตอนจบและตอน Error)
					function resetBtn() {
						if (btn) {
							btn.innerHTML = originalIcon;
							btn.disabled = false;
							btn.classList.remove('animate-pulse'); // หยุด Effect ถ้ามี
						}
					}

					// 1. ลองสั่งหยุดของเก่าก่อน (เผื่อค้าง)
					try {
						recognition.abort(); 
					} catch (e) { 
						// ปล่อยผ่านถ้าไม่มีอะไรทำงานอยู่
					}

					// 2. เปลี่ยนไอคอนเป็นกำลังฟัง
					if (btn) {
						btn.innerHTML = '<i class="fa-solid fa-microphone-lines text-xl fa-beat text-red-500"></i>';
						btn.disabled = true;
					}

					// 3. เริ่มดักจับเสียง
					try {
						recognition.start();
					} catch (err) {
						console.error("Voice Start Error:", err);
						resetBtn();
						// ถ้า Error เพราะเปิดซ้ำ (Already started) ไม่ต้องแจ้งเตือน
						if (err.name !== 'InvalidStateError') {
							Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเริ่มไมโครโฟนได้: ' + err.message, 'error');
						}
						return;
					}

					// --- Events ---
					recognition.onresult = (event) => {
						const transcript = event.results[0][0].transcript;
						console.log('Modal Voice transcript:', transcript);

						const parsed = parseVoiceInput(transcript);
						if (!parsed) {
							// แจ้งเตือน (แบบใหม่)
                            showToast("ไม่เข้าใจคำสั่งเสียง", "warning");
							resetBtn();
							return;
						}

						const { type, name, amount, description } = parsed;
						const category = autoSelectCategory(name, type);

						// --- เติมข้อมูลลงฟอร์ม ---
						const getEl = (id) => document.getElementById(id);

						if (name) getEl('tx-name').value = name;
						if (amount) {
							getEl('tx-amount').value = amount;
							// Trigger event ให้ระบบคำนวณทำงาน (เผื่อมี logic อื่น)
							getEl('tx-amount').dispatchEvent(new Event('keyup'));
						}
						
						if (description) {
								const currentDesc = getEl('tx-desc').value;
								getEl('tx-desc').value = currentDesc ? currentDesc + ' ' + description : description;
						}

						// อัปเดตประเภทและหมวดหมู่
						const currentType = document.querySelector('input[name="tx-type"]:checked').value;
						if (currentType !== type) {
							document.querySelector(`input[name="tx-type"][value="${type}"]`).checked = true;
							updateCategoryDropdown(type); 
							updateFormVisibility();       
						}

						// เลือกหมวดหมู่ (Delay เล็กน้อยเพื่อให้ Dropdown สร้างเสร็จ)
						setTimeout(() => {
							if(getEl('tx-category')) getEl('tx-category').value = category;
							
							// แสดง Hint ว่าเติมข้อมูลแล้ว
							const hintEl = getEl('auto-fill-hint');
							if(hintEl) {
								hintEl.innerHTML = '<i class="fa-solid fa-microphone"></i> เติมข้อมูลจากเสียงแล้ว';
								hintEl.classList.remove('hidden');
								setTimeout(() => hintEl.classList.add('hidden'), 3000);
							}
						}, 100);
					};

					recognition.onerror = (event) => {
						console.error('Speech recognition error', event.error);
						if (event.error === 'no-speech') {
							// ไม่ต้องแจ้งเตือนอะไรมาก แค่คืนค่าปุ่ม
						} else if (event.error === 'aborted') {
							// ผู้ใช้กดหยุดเอง หรือระบบสั่งหยุด
						} else {
							Swal.fire('ข้อผิดพลาด', 'การจดจำเสียงขัดข้อง: ' + event.error, 'error');
						}
						resetBtn();
					};

					recognition.onend = () => {
						resetBtn();
					};
				}
				
				/* =======================================================
				   [NEW V6] BUDGET FUNCTIONS
				   ======================================================= */

				// 1. ฟังก์ชันเตรียม Dropdown หมวดหมู่ในหน้าตั้งค่า
				function populateBudgetCategoryDropdown() {
					const dropdown = document.getElementById('input-budget-category');
					if (!dropdown) return;
					dropdown.innerHTML = '';
					
					// ดึงเฉพาะหมวดหมู่รายจ่าย
					const expenses = state.categories.expense || [];
					if (expenses.length === 0) {
						dropdown.innerHTML = '<option value="">ไม่มีหมวดหมู่</option>';
						return;
					}
					
					expenses.forEach(cat => {
						// เช็คว่าหมวดหมู่นี้ตั้งงบไปแล้วหรือยัง
						const exists = state.budgets.find(b => b.category === cat);
						const label = exists ? `${cat} (ตั้งแล้ว: ${formatCurrency(exists.amount)})` : cat;
						dropdown.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(cat)}">${label}</option>`);
					});
				}

				// 2. ฟังก์ชันเรนเดอร์รายการในหน้าตั้งค่า
				function renderBudgetSettingsList() {
					const listEl = document.getElementById('list-budget-settings');
					if (!listEl) return;
					listEl.innerHTML = '';
					
					if (state.budgets.length === 0) {
						listEl.innerHTML = '<li class="text-gray-500 text-center p-2">ยังไม่ได้ตั้งงบประมาณ</li>';
						return;
					}

					state.budgets.forEach(budget => {
						// [แก้ไข] ปรับ Style ปุ่มให้เหมือนหัวข้ออื่น (สีน้ำเงิน/สีแดง ไม่มีพื้นหลัง)
						const li = `
							<li class="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
								<div>
									<span class="font-bold text-gray-700">${escapeHTML(budget.category)}</span>
									<span class="text-sm text-gray-500 block">วงเงิน: ${formatCurrency(budget.amount)}</span>
								</div>
								<div class="flex gap-2">
									<button class="text-blue-500 hover:text-blue-700 p-2 transition-colors" onclick="editBudget('${escapeHTML(budget.category)}')">
										<i class="fa-solid fa-pencil"></i>
									</button>
									<button class="text-red-500 hover:text-red-700 p-2 transition-colors" onclick="deleteBudget('${escapeHTML(budget.category)}')">
										<i class="fa-solid fa-trash-alt"></i>
									</button>
								</div>
							</li>`;
						listEl.insertAdjacentHTML('beforeend', li);
					});
				}

				// 3. ฟังก์ชันบันทึกงบประมาณ
				async function handleAddBudget(e) {
					e.preventDefault();
					const category = document.getElementById('input-budget-category').value;
					const amount = parseFloat(document.getElementById('input-budget-amount').value);

					if (!category || isNaN(amount) || amount <= 0) {
						Swal.fire('ข้อมูลไม่ถูกต้อง', 'กรุณาเลือกหมวดหมู่และใส่วงเงินให้ถูกต้อง', 'warning');
						return;
					}

					const newBudget = { category, amount };

					try {
						await dbPut(STORE_BUDGETS, newBudget);
						
						// อัปเดต State (ถ้ามีอยู่แล้วให้ทับ ถ้าไม่มีให้เพิ่ม)
						const idx = state.budgets.findIndex(b => b.category === category);
						if (idx >= 0) state.budgets[idx] = newBudget;
						else state.budgets.push(newBudget);

						renderBudgetSettingsList();
						populateBudgetCategoryDropdown();
						document.getElementById('form-add-budget').reset();
						
						// รีเฟรช Widget หน้าแรกทันที
						renderBudgetWidget();
						
						Swal.fire('สำเร็จ', `ตั้งงบประมาณหมวด <b>${category}</b> เรียบร้อย`, 'success');
					} catch (err) {
						console.error(err);
						Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
					}
				}
				
				// [NEW] ฟังก์ชันแก้ไขงบประมาณ (ต้องใส่รหัสผ่าน)
				window.editBudget = async (category) => {
					// 1. ถามรหัสผ่าน
					const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อแก้ไขงบประมาณ');
					if (!hasPermission) return;

					// 2. หาข้อมูลเดิม
					const budget = state.budgets.find(b => b.category === category);
					if (!budget) return;

					// 3. แสดง Popup ให้แก้ตัวเลข
					const { value: newAmount } = await Swal.fire({
						title: `แก้ไขงบหมวด: ${category}`,
						input: 'number',
						inputLabel: 'กำหนดวงเงินใหม่ (บาท)',
						inputValue: budget.amount,
						showCancelButton: true,
						confirmButtonColor: '#3b82f6', // สีน้ำเงิน (Standard)
						confirmButtonText: 'บันทึกแก้ไข',
						cancelButtonText: 'ยกเลิก',
						inputValidator: (value) => {
							if (!value || value <= 0) {
								return 'กรุณาใส่วงเงินที่ถูกต้อง';
							}
						}
					});

					// 4. บันทึก
					if (newAmount) {
						try {
							const updatedBudget = { category, amount: parseFloat(newAmount) };
							
							await dbPut(STORE_BUDGETS, updatedBudget);
							
							const idx = state.budgets.findIndex(b => b.category === category);
							if (idx >= 0) state.budgets[idx] = updatedBudget;

							renderBudgetSettingsList();
							renderBudgetWidget();
							
							Swal.fire('เรียบร้อย', 'แก้ไขวงเงินงบประมาณแล้ว', 'success');
						} catch (err) {
							console.error(err);
							Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
						}
					}
				};

				// [UPDATE] ฟังก์ชันลบงบประมาณ (ต้องใส่รหัสผ่าน)
				window.deleteBudget = async (category) => {
					// 1. ถามรหัสผ่าน
					const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อลบงบประมาณ');
					if (!hasPermission) return;

					// 2. ยืนยันการลบ
					const result = await Swal.fire({
						title: 'ยืนยันการลบ?',
						text: `คุณต้องการลบงบประมาณหมวด "${category}" ใช่ไหม?`,
						icon: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#d33',
						confirmButtonText: 'ลบเลย',
						cancelButtonText: 'ยกเลิก'
					});

					if (result.isConfirmed) {
						try {
							await dbDelete(STORE_BUDGETS, category);
							
							state.budgets = state.budgets.filter(b => b.category !== category);
							
							renderBudgetSettingsList();
							populateBudgetCategoryDropdown(); 
							renderBudgetWidget();
							
							Swal.fire('ลบแล้ว', 'รายการงบประมาณถูกลบเรียบร้อย', 'success');
						} catch (err) {
							console.error(err);
							Swal.fire('Error', 'ลบไม่สำเร็จ', 'error');
						}
					}
				};

				// 5. ฟังก์ชันคำนวณและแสดงผล Widget หน้าแรก (รองรับการดูย้อนหลัง)
				function renderBudgetWidget() {
					const widget = document.getElementById('home-budget-widget');
					const container = document.getElementById('budget-list-container');
					if (!widget || !container) return;

					if (state.budgets.length === 0) {
						widget.classList.add('hidden');
						return;
					}
					
					widget.classList.remove('hidden');
					container.innerHTML = '';

					// ใช้ state.homeCurrentDate เพื่อให้ดูเดือนที่เลือกอยู่ (ไม่ใช่แค่เดือนปัจจุบัน)
					const selectedDate = new Date(state.homeCurrentDate);
					const selectedMonth = selectedDate.getMonth();
					const selectedYear = selectedDate.getFullYear();

					const now = new Date();
					const currentRealMonth = now.getMonth();
					const currentRealYear = now.getFullYear();

					const isCurrentMonth = (selectedMonth === currentRealMonth && selectedYear === currentRealYear);
					const isPastMonth = (selectedYear < currentRealYear) || (selectedYear === currentRealYear && selectedMonth < currentRealMonth);

					// อัปเดตหัวข้อ Widget
					const monthName = selectedDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
					const headerTitle = widget.querySelector('h2');
					if (headerTitle) {
						headerTitle.innerHTML = `<i class="fa-solid fa-bullseye text-red-500 mr-2"></i> งบประมาณ (${monthName})`;
					}

					const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
					
					let daysRemaining = 0;
					if (isCurrentMonth) {
						daysRemaining = daysInMonth - now.getDate();
					} else if (!isPastMonth) {
						daysRemaining = daysInMonth;
					} 

					const expensesInSelectedMonth = state.transactions.filter(tx => {
						const d = new Date(tx.date);
						return tx.type === 'expense' && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
					});

					state.budgets.forEach(budget => {
						const spent = expensesInSelectedMonth
							.filter(tx => tx.category === budget.category)
							.reduce((sum, tx) => sum + tx.amount, 0);

						const percent = Math.min((spent / budget.amount) * 100, 100);
						const remaining = budget.amount - spent;
						
						let barColor = 'bg-green-500';
						let statusText = 'ปกติ';
						let statusClass = 'text-green-600';

						if (percent >= 100) {
							barColor = 'bg-red-600';
							statusText = 'เกินงบแล้ว!';
							statusClass = 'text-red-600 font-bold'; 
							if (isCurrentMonth) statusClass += ' animate-pulse';
						} else if (percent >= 80) {
							barColor = 'bg-red-500';
							statusText = 'วิกฤต';
							statusClass = 'text-red-500 font-bold';
						} else if (percent >= 50) {
							barColor = 'bg-yellow-400';
							statusText = 'ระวัง';
							statusClass = 'text-yellow-600';
						}

						let adviceHtml = '';
						if (isCurrentMonth) {
							if (remaining > 0 && daysRemaining > 0) {
								const dailySafe = remaining / daysRemaining;
								adviceHtml = `<div class="text-xs text-gray-500 mt-1 flex items-center gap-1">
									<i class="fa-solid fa-calendar-day text-blue-400"></i> ใช้ได้อีกวันละ <span class="font-bold text-blue-600">${formatCurrency(dailySafe)}</span> (เหลือ ${daysRemaining} วัน)
								</div>`;
							} else if (remaining <= 0) {
								adviceHtml = `<div class="text-xs text-red-500 mt-1 font-bold">งบหมดแล้ว! พยายามลดรายจ่ายนะ</div>`;
							}
						} else if (isPastMonth) {
							if (remaining >= 0) {
								adviceHtml = `<div class="text-xs text-green-600 mt-1 flex items-center gap-1">
									<i class="fa-solid fa-check-circle"></i> ปิดงบเดือนนี้: <span class="font-bold">ประหยัดได้ ${formatCurrency(remaining)}</span> เยี่ยมมาก!
								</div>`;
							} else {
								adviceHtml = `<div class="text-xs text-red-500 mt-1 flex items-center gap-1">
									<i class="fa-solid fa-circle-exclamation"></i> ปิดงบเดือนนี้: <span class="font-bold">เกินงบไป ${formatCurrency(Math.abs(remaining))}</span>
								</div>`;
							}
						} else {
							 adviceHtml = `<div class="text-xs text-gray-400 mt-1">วางแผนล่วงหน้า</div>`;
						}

						// เพิ่ม class 'budget-item-click' เพื่อใช้อ้างอิง
						const html = `
							<div class="budget-item-click cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200" data-category="${escapeHTML(budget.category)}">
								<div class="flex justify-between items-end mb-1">
									<span class="font-bold text-gray-700 text-sm">${escapeHTML(budget.category)} <i class="fa-solid fa-chevron-right text-gray-300 text-xs ml-1"></i></span>
									<span class="text-xs ${statusClass}">${statusText} (${Math.round(percent)}%)</span>
								</div>
								
								<div class="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden dark:bg-gray-700">
									<div class="${barColor} h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.2)]" style="width: ${percent}%"></div>
								</div>

								<div class="flex justify-between items-center mt-1">
									<span class="text-xs text-gray-500">${formatCurrency(spent)} / ${formatCurrency(budget.amount)}</span>
									<span class="text-xs font-bold ${remaining < 0 ? 'text-red-500' : 'text-gray-500'}">
										${remaining >= 0 ? 'คงเหลือ ' + formatCurrency(remaining) : 'เกิน ' + formatCurrency(Math.abs(remaining))}
									</span>
								</div>
								${adviceHtml}
							</div>
						`;
						container.insertAdjacentHTML('beforeend', html);
					});

					// [NEW] เพิ่มส่วนคลิกแล้วเด้งไปหน้ารายการ (Advanced Filter)
					container.querySelectorAll('.budget-item-click').forEach(item => {
						item.addEventListener('click', () => {
							const category = item.dataset.category;
							
							// 1. ตั้งค่า Filter ให้เป็น "รายจ่าย" + "ชื่อหมวดที่กด"
							state.advFilterType = 'expense';
							state.advFilterSearch = category;
							
							// 2. ตั้งวันที่ให้ตรงกับเดือนที่ดูอยู่บน Dashboard
							const d = new Date(state.homeCurrentDate);
							const y = d.getFullYear();
							const m = d.getMonth();
							// วันแรกของเดือน - วันสุดท้ายของเดือน
							state.advFilterStart = new Date(y, m, 1).toISOString().slice(0, 10);
							state.advFilterEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);
							
							// 3. อัปเดต UI ของตัวกรองหน้า List
							const startEl = document.getElementById('adv-filter-start');
							const endEl = document.getElementById('adv-filter-end');
							const typeEl = document.getElementById('adv-filter-type');
							const searchEl = document.getElementById('adv-filter-search');
							
							if (startEl) startEl.value = state.advFilterStart;
							if (endEl) endEl.value = state.advFilterEnd;
							if (typeEl) typeEl.value = 'expense';
							if (searchEl) searchEl.value = category;

							// 4. กระโดดไปหน้า List และสั่งค้นหาทันที
							showPage('page-list');
							if (typeof renderListPage === 'function') {
								renderListPage();
							}
						});
					});
				}
				
				// ฟังก์ชันอัปเดตระบบและล้างแคช (แก้ปัญหาโค้ดไม่เปลี่ยนในมือถือ)
				async function handleSystemUpdate() {
					const result = await Swal.fire({
						title: 'อัปเดตระบบ?',
						text: "ระบบจะทำการล้างแคชและโหลดโค้ดเวอร์ชันล่าสุด (ข้อมูลบัญชีจะไม่หาย)",
						icon: 'question',
						showCancelButton: true,
						confirmButtonColor: '#f97316',
						confirmButtonText: 'อัปเดตทันที',
						cancelButtonText: 'ยกเลิก',
						customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
						background: state.isDarkMode ? '#1a1a1a' : '#fff',
						color: state.isDarkMode ? '#e5e7eb' : '#545454'
					});

					if (result.isConfirmed) {
						Swal.fire({
							title: 'กำลังอัปเดต...',
							html: 'กรุณารอสักครู่ ระบบกำลังดึงข้อมูลล่าสุด',
							allowOutsideClick: false,
							didOpen: () => { Swal.showLoading(); }
						});

						try {
							// 1. ถอนการติดตั้ง Service Worker ตัวเก่า (ตัวการที่จำไฟล์)
							if ('serviceWorker' in navigator) {
								const registrations = await navigator.serviceWorker.getRegistrations();
								for (const registration of registrations) {
									await registration.unregister();
								}
							}

							// 2. ลบ Cache Storage ทั้งหมด
							if ('caches' in window) {
								const keys = await caches.keys();
								await Promise.all(keys.map(key => caches.delete(key)));
							}

							// 3. รีโหลดหน้าจอแบบ Force Reload
							setTimeout(() => {
								window.location.reload(true);
							}, 1000);

						} catch (error) {
							console.error("Update failed:", error);
							// ถ้าพัง ให้รีโหลดธรรมดา
							window.location.reload();
						}
					}
				}
				
				// ============================================
				// BIOMETRIC AUTHENTICATION FUNCTIONS
				// ============================================

				// 1. ลงทะเบียน (Register) - ผูกเครื่องนี้กับแอพ
				async function registerBiometric() {
					if (!window.PublicKeyCredential) {
						Swal.fire('ไม่รองรับ', 'อุปกรณ์นี้ไม่รองรับการสแกนนิ้ว/ใบหน้า', 'error');
						return;
					}

					// ถามรหัสผ่านก่อนอนุญาตให้ตั้งค่า
					const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อตั้งค่าสแกนนิ้ว');
					if (!hasPermission) return;

					Swal.fire({
						title: 'กำลังลงทะเบียน...',
						text: 'กรุณาสแกนลายนิ้วมือหรือใบหน้า',
						allowOutsideClick: false,
						didOpen: () => { Swal.showLoading(); }
					});

					try {
						// สร้าง Challenge สุ่ม (ปกติควรมาจาก Server แต่ทำ Local ใช้แบบนี้ได้)
						const challenge = new Uint8Array(32);
						window.crypto.getRandomValues(challenge);

						const publicKey = {
							challenge: challenge,
							rp: { name: "Finance Manager Pro (Local)" },
							user: {
								id: new Uint8Array(16),
								name: "user",
								displayName: "Device Owner"
							},
							pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
							authenticatorSelection: { 
								authenticatorAttachment: "platform", // บังคับใช้ตัวสแกนในเครื่อง (TouchID/FaceID)
								userVerification: "required" 
							},
							timeout: 60000
						};

						const credential = await navigator.credentials.create({ publicKey });
						
						// แปลง Credential ID เป็น String เพื่อเก็บใน LocalStorage
						const credentialId = bufferToBase64url(credential.rawId);
						
						// บันทึกลง LocalStorage
						localStorage.setItem('local_biometric_id', credentialId);
						state.biometricId = credentialId;

						renderSettings(); // อัปเดตหน้า UI
						
						Swal.fire('สำเร็จ', 'เปิดใช้งานสแกนนิ้ว/ใบหน้าสำหรับเครื่องนี้แล้ว', 'success');

					} catch (err) {
						console.error(err);
						Swal.fire('ล้มเหลว', 'การลงทะเบียนถูกยกเลิกหรือไม่สำเร็จ', 'error');
					}
				}

				// 2. ยกเลิก (Unregister)
				async function removeBiometric() {
					// [เพิ่มใหม่] 1. ถามรหัสผ่านก่อนดำเนินการ
					const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อยกเลิกสแกนนิ้ว');
					if (!hasPermission) return;

					// 2. แสดง Popup ยืนยันตามปกติ
					const result = await Swal.fire({
						title: 'ยกเลิกการสแกน?',
						text: "คุณจะต้องใช้รหัสผ่านในการเข้าใช้งานแทน",
						icon: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#d33',
						confirmButtonText: 'ยกเลิกการใช้',
						cancelButtonText: 'กลับ'
					});

					if (result.isConfirmed) {
						localStorage.removeItem('local_biometric_id');
						state.biometricId = null;
						renderSettings();
						Swal.fire('เรียบร้อย', 'ยกเลิกการสแกนนิ้วบนเครื่องนี้แล้ว', 'success');
					}
				}

				// 3. ตรวจสอบตัวตน (Verify) - ใช้ตอน Login หรือ Prompt
				async function verifyBiometricIdentity() {
					if (!state.biometricId) return false;

					try {
						const savedIdBuffer = base64urlToBuffer(state.biometricId);
						const challenge = new Uint8Array(32);
						window.crypto.getRandomValues(challenge);

						const publicKey = {
							challenge: challenge,
							allowCredentials: [{
								id: savedIdBuffer,
								type: 'public-key',
								transports: ['internal']
							}],
							userVerification: "required"
						};

						const assertion = await navigator.credentials.get({ publicKey });
						
						if (assertion) {
							return true; // สแกนผ่าน
						}
					} catch (err) {
						console.error("Biometric verify failed:", err);
					}
					return false;
				}
				
				// --- ฟังก์ชันส่งแจ้งเตือน LINE (เวอร์ชันรองรับรายการล่วงหน้า) ---
				async function sendLineAlert(transactionData, action = 'add') {
					// 1. ดึงรายการ ID ทั้งหมด
					let targetIds = [];
					try {
						const config = await dbGet(STORE_CONFIG, 'lineUserIds_List');
						if (config && Array.isArray(config.value)) {
							targetIds = config.value.map(item => (typeof item === 'string') ? item : item.id);
						}
					} catch (e) { console.error(e); }

					if (targetIds.length === 0) return;

					// 2. ตรวจสอบว่าเป็นรายการล่วงหน้าหรือไม่
					const txDate = new Date(transactionData.date);
					const now = new Date();
					// ถ้าเวลาในรายการมากกว่าเวลาปัจจุบัน ให้ถือว่าเป็นรายการล่วงหน้า
					const isFuture = txDate > now;

					// 3. เตรียม Header ตาม Action และสถานะเวลา
					let headerText = '';
					if (action === 'add') {
						headerText = isFuture ? '📅 เพิ่มรายการใหม่ล่วงหน้า' : '✨ เพิ่มรายการใหม่';
					} else if (action === 'edit') {
						headerText = isFuture ? '📝 แก้ไขรายการล่วงหน้า' : '✏️ แก้ไขรายการ';
					} else if (action === 'delete') {
						headerText = isFuture ? '🗑️ ลบรายการล่วงหน้า' : '🗑️ ลบรายการ';
					}

					// 4. เตรียมรายละเอียดข้อมูล
					const typeText = transactionData.type === 'income' ? '🟢 รายรับ' : (transactionData.type === 'expense' ? '🔴 รายจ่าย' : '🔵 โอนย้าย');
					const amountText = Number(transactionData.amount).toLocaleString('th-TH');
					
					let accountInfo = '';
					if (transactionData.type === 'transfer') {
						const fromAcc = state.accounts.find(a => a.id === transactionData.accountId);
						const toAcc = state.accounts.find(a => a.id === transactionData.toAccountId);
						accountInfo = `\n🏦 จาก: ${fromAcc ? fromAcc.name : 'ไม่ระบุ'}\n➡️ ไป: ${toAcc ? toAcc.name : 'ไม่ระบุ'}`;
					} else {
						const acc = state.accounts.find(a => a.id === transactionData.accountId);
						const accLabel = transactionData.type === 'income' ? 'เข้าบัญชี' : 'จากบัญชี';
						accountInfo = `\n🏦 ${accLabel}: ${acc ? acc.name : 'ไม่ระบุ'}`;
					}
					
					const dateText = txDate.toLocaleString('th-TH', { 
						year: 'numeric', month: 'short', day: 'numeric', 
						hour: '2-digit', minute: '2-digit' 
					});

					const descText = transactionData.desc ? `\n📝 บันทึก: ${transactionData.desc}` : '';

					// 5. ประกอบข้อความ
					const message = `${headerText}${accountInfo}\n${typeText}: ${transactionData.name}\n💰 จำนวน: ${amountText} บาท\n📂 หมวดหมู่: ${transactionData.category || '-'}\n📅 วันที่: ${dateText}${descText}`;

					// 6. ส่งข้อมูลไปยัง LINE Notify (ผ่าน Google Apps Script)
					const GAS_URL = 'https://script.google.com/macros/s/AKfycbxPpU4YA-L6a5FH0dG6xb9u52gxxbuc5zBlWWkQg2DMDbMRwGNyCn-k4ISPPYRPtRw_/exec'; 
					try {
						await fetch(GAS_URL, {
							method: 'POST',
							mode: 'no-cors',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ userIds: targetIds, message: message })
						});
						console.log(`ส่ง LINE Alert (${isFuture ? 'Future' : 'Normal'}) เรียบร้อย`);
					} catch (error) {
						console.error('ส่ง LINE ไม่ผ่าน:', error);
					}
				}
				
				// ============================================
				// ฟังก์ชันแจ้งเตือนแบบใหม่ (ซ้ายบน + ดีไซน์สวย)
				// ============================================
