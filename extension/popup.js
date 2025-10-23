document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.sync.get(['emails', 'senderName', 'backendUrl']);
    document.getElementById('senderName').value = data.senderName || '';
    document.getElementById('backendUrl').value = data.backendUrl || 'http://localhost:8080';
    renderEmailList(data.emails || []);
});

function renderEmailList(emails) {
    const emailList = document.getElementById('emailList');
    if (emails.length === 0) {
        emailList.innerHTML = '<div class="empty-state">No recipients added yet</div>';
        return;
    }
    emailList.innerHTML = emails.map(email => `
        <div class="email-item">
            <span>${email}</span>
            <button class="remove-btn" data-email="${email}">×</button>
        </div>
    `).join('');
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeEmail(btn.dataset.email));
    });
}

document.getElementById('addEmailBtn').addEventListener('click', async () => {
    const emailInput = document.getElementById('newEmail');
    const email = emailInput.value.trim();
    if (!email || !isValidEmail(email)) {
        showStatus('Please enter a valid email', 'error');
        return;
    }
    const data = await chrome.storage.sync.get(['emails']);
    const emails = data.emails || [];
    if (emails.includes(email)) {
        showStatus('Email already added', 'error');
        return;
    }
    emails.push(email);
    await chrome.storage.sync.set({ emails });
    emailInput.value = '';
    renderEmailList(emails);
    showStatus('Email added successfully', 'success');
});

async function removeEmail(emailToRemove) {
    const data = await chrome.storage.sync.get(['emails']);
    const emails = (data.emails || []).filter(email => email !== emailToRemove);
    await chrome.storage.sync.set({ emails });
    renderEmailList(emails);
    showStatus('Email removed', 'success');
}

document.getElementById('saveBtn').addEventListener('click', async () => {
    const senderName = document.getElementById('senderName').value.trim();
    const backendUrl = document.getElementById('backendUrl').value.trim();
    if (!backendUrl) {
        showStatus('Please enter a backend URL', 'error');
        return;
    }
    const backendPassword = document.getElementById('backendPassword').value.trim();
    await chrome.storage.sync.set({ senderName, backendUrl, backendPassword });
    showStatus('Settings saved successfully', 'success');
});

function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;
    setTimeout(() => {
        statusDiv.className = '';
        statusDiv.textContent = '';
    }, 3000);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
