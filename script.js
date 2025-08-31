// --- SMOOTH PAGE TRANSITION LOGIC ---
const transitionOverlay = document.getElementById('page-transition-overlay');
if (sessionStorage.getItem('isTransitioning')) {
    transitionOverlay.classList.remove('hidden');
    sessionStorage.removeItem('isTransitioning'); 
} else {
    transitionOverlay.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    // --- CORE SETUP & AUTHENTICATION ---
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser && currentPage !== 'login.html') { window.location.href = 'login.html'; return; }
    if (loggedInUser && currentPage === 'login.html') { window.location.href = 'index.html'; return; }

    // --- DATA HANDLING ---
    const getStoredData = (key) => {
        if (!loggedInUser) return [];
        const userKey = `tradex_${loggedInUser}_${key}`;
        return JSON.parse(localStorage.getItem(userKey)) || [];
    };
    const setStoredData = (key, data) => {
        if (!loggedInUser) return;
        const userKey = `tradex_${loggedInUser}_${key}`;
        localStorage.setItem(userKey, JSON.stringify(data));
    };

    // --- UI INITIALIZATION ---
    if (typeof lucide !== 'undefined') lucide.createIcons();
    window.addEventListener('load', () => { setTimeout(() => { if (transitionOverlay) transitionOverlay.classList.add('hidden'); }, 50); });
    document.querySelectorAll('a:not(#logout-btn):not([href="#"])').forEach(link => {
        if (link.hostname === window.location.hostname) {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                sessionStorage.setItem('isTransitioning', 'true');
                transitionOverlay.classList.remove('hidden');
                setTimeout(() => { window.location.href = link.href; }, 400); 
            });
        }
    });
    const vantaBg = document.getElementById('vanta-bg');
    if (vantaBg) {
        const isLoginPage = currentPage === 'login.html';
        const vantaEffect = isLoginPage ? VANTA.WAVES : VANTA.FOG;
        const vantaOptions = isLoginPage ? { color: 0x0d1117, shininess: 30.00, waveHeight: 15.00, waveSpeed: 0.8, zoom: 0.8 } : { highlightColor: 0x3b82f6, midtoneColor: 0x1e293b, lowlightColor: 0x161b22, baseColor: 0x0d1117, blurFactor: 0.5, speed: 1.2, zoom: 0.6 };
        vantaEffect({ el: "#vanta-bg", ...vantaOptions });
        setTimeout(() => vantaBg.classList.add('!opacity-100'), 50);
    }
    const mainContent = document.getElementById('main-content');
    if (mainContent) setTimeout(() => mainContent.classList.remove('opacity-0', 'translate-y-4'), 100);

    // --- LOGIN PAGE LOGIC ---
    if (currentPage === 'login.html') {
        const loginForm = document.getElementById('login-form');
        const hashPassword = async (p) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p)))).map(b => b.toString(16).padStart(2, '0')).join('');
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            if (!username || !password) return alert('Please enter both username and password.');
            const users = JSON.parse(localStorage.getItem('tradex_users')) || [];
            const existingUser = users.find(user => user.username === username);
            const hashedPassword = await hashPassword(password);
            if (existingUser) { // Login
                if (existingUser.hashedPassword === hashedPassword) loginUser(username);
                else alert('Incorrect password.');
            } else { // Register
                users.push({ username, hashedPassword });
                localStorage.setItem('tradex_users', JSON.stringify(users));
                loginUser(username);
            }
        });
        const loginUser = (username) => {
            document.querySelector('.login-container').classList.add('opacity-0', 'scale-90');
            setTimeout(() => {
                localStorage.setItem('loggedInUser', username);
                sessionStorage.setItem('isTransitioning', 'true');
                window.location.href = 'index.html';
            }, 500);
        };
    }

    // --- SHARED DASHBOARD UI ---
    if (currentPage !== 'login.html') {
        const themeToggle = document.getElementById('theme-toggle');
        const applyTheme = (theme) => {
            document.documentElement.classList.toggle('light', theme === 'light');
            document.getElementById('theme-icon-light').classList.toggle('hidden', theme !== 'light');
            document.getElementById('theme-icon-dark').classList.toggle('hidden', theme === 'light');
        };
        const currentTheme = localStorage.getItem('theme') || 'dark'; applyTheme(currentTheme);
        themeToggle.addEventListener('click', () => {
            const newTheme = document.documentElement.classList.contains('light') ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme); applyTheme(newTheme);
        });
        document.getElementById('sidebar-open-btn')?.addEventListener('click', () => document.getElementById('sidebar').classList.remove('-translate-x-full'));
        document.getElementById('sidebar-close-btn')?.addEventListener('click', () => document.getElementById('sidebar').classList.add('-translate-x-full'));
        document.getElementById('welcome-user').textContent = `Welcome, ${loggedInUser}`;
        const userAvatar = document.getElementById('user-avatar');
        if(userAvatar){
             const initial = loggedInUser.charAt(0).toUpperCase();
             const colorClass = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500'][loggedInUser.length % 4];
             userAvatar.classList.add(colorClass); userAvatar.textContent = initial;
        }
        const userMenuButton = document.getElementById('user-menu-button');
        userMenuButton?.addEventListener('click', () => document.getElementById('dropdown-menu').classList.toggle('hidden'));
        document.addEventListener('click', (e) => { if (!userMenuButton?.contains(e.target)) document.getElementById('dropdown-menu')?.classList.add('hidden'); });
        document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); localStorage.removeItem('loggedInUser'); sessionStorage.setItem('isTransitioning', 'true'); transitionOverlay.classList.remove('hidden'); setTimeout(() => { window.location.href = 'login.html'; }, 400); });
    }

    // --- HELPER FUNCTIONS ---
    const populateAccountDropdown = (el) => { if (!el) return; const accounts = getStoredData('accounts'); const ph = el.options[0]; el.innerHTML = ''; el.appendChild(ph); accounts.forEach(acc => el.add(new Option(acc.name, acc.name))); };
    const animateCounter = (el, to) => {
        let from = parseFloat(el.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        if(isNaN(from)) from = 0;
        const duration = 1500;
        const step = (timestamp) => {
            let progress = Math.min((timestamp - start) / duration, 1);
            const value = from + (to - from) * progress;
            if (el.textContent.includes('%')) el.textContent = `${value.toFixed(0)}%`;
            else if (el.textContent.includes('$')) el.textContent = `${to >= 0 ? '' : '-'}$${Math.abs(value).toFixed(2)}`;
            else el.textContent = value.toFixed(0);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        const start = performance.now();
        window.requestAnimationFrame(step);
    };

    // --- HOME PAGE (`index.html`) ---
    if (currentPage === 'index.html') {
        const activeGoals = getStoredData('goals').filter(g => !g.completed).sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
        const journal = getStoredData('journal');
        const wins = journal.filter(t => parseFloat(t.pnl) > 0).length;
        const losses = journal.filter(t => parseFloat(t.pnl) < 0).length;
        const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
        
        animateCounter(document.getElementById('stats-win-rate'), winRate);
        animateCounter(document.getElementById('stats-active-goals'), activeGoals.length);
        animateCounter(document.getElementById('stats-accounts'), getStoredData('accounts').length);

        if (journal.length > 0) {
            const lastPnl = parseFloat(journal.sort((a,b) => new Date(b.date) - new Date(a.date))[0].pnl) || 0;
            const lastPnlEl = document.getElementById('stats-last-pnl');
            lastPnlEl.className = `text-4xl font-bold my-1 ${lastPnl >= 0 ? 'text-green-400' : 'text-red-400'}`;
            animateCounter(lastPnlEl, lastPnl);
            
            const bestTrade = journal.reduce((max, t) => (parseFloat(t.pnl) || 0) > (parseFloat(max.pnl) || 0) ? t : max, {pnl: 0});
            if(parseFloat(bestTrade.pnl) > 0) {
                const widget = document.getElementById('best-trade-widget');
                widget.classList.remove('hidden');
                widget.innerHTML = `<h2 class="text-xl font-semibold text-blue-400 mb-3">Best Trade Highlight</h2><div class="flex items-center justify-between"><div<p class="font-bold text-lg">${bestTrade.asset}</p><p class="text-sm text-[var(--text-secondary)]">${new Date(bestTrade.date+'T00:00:00').toLocaleDateString()}</p></div><p class="text-2xl font-bold text-green-400">+$${parseFloat(bestTrade.pnl).toFixed(2)}</p></div>`;
            }
        }
        
        const goalsWidget = document.getElementById('active-goals-widget');
        if (activeGoals.length > 0) {
            let goalsHTML = activeGoals.slice(0, 3).map(goal => {
                const startDate = new Date(goal.id), deadlineDate = new Date(goal.deadline + 'T23:59:59'), now = new Date();
                const totalDuration = deadlineDate - startDate;
                const progressPercent = Math.min(100, Math.max(0, ((now - startDate) / totalDuration) * 100));
                const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
                const daysText = now > deadlineDate ? "Overdue" : `${daysLeft}d left`;
                let color = 'var(--success-color)';
                if (progressPercent >= 85) color = 'var(--danger-color)';
                else if (progressPercent >= 50) color = 'var(--warning-color)';
                const radius = 52, circumference = 2 * Math.PI * radius;
                const offset = circumference - (progressPercent / 100) * circumference;
                return `<div class="flex items-center gap-4"><div class="relative h-28 w-28 flex-shrink-0"><svg class="w-full h-full" viewBox="0 0 120 120"><circle class="text-slate-700" stroke-width="10" stroke="currentColor" fill="transparent" r="${radius}" cx="60" cy="60"/><circle class="progress-ring__circle" stroke-width="10" stroke="${color}" stroke-linecap="round" fill="transparent" r="${radius}" cx="60" cy="60" style="stroke-dasharray:${circumference}; stroke-dashoffset:${circumference};" data-offset="${offset}" /></svg><span class="absolute text-sm font-semibold top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">${daysText}</span></div><p class="font-semibold flex-1">${goal.description}</p></div>`;
            }).join('');
            goalsWidget.innerHTML = `<h2 class="text-2xl font-bold mb-6">Active Goals</h2><div class="space-y-6">${goalsHTML}</div>`;
            setTimeout(() => document.querySelectorAll('.progress-ring__circle').forEach(c => c.style.strokeDashoffset = c.dataset.offset), 100);
        } else {
            goalsWidget.innerHTML = `<h2 class="text-2xl font-bold mb-6">Active Goals</h2><div class="text-center py-10"><svg class="mx-auto h-20 w-20 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 8v4l2 2"></path></svg><h3 class="mt-4 font-bold">No Active Goals</h3><p class="text-[var(--text-secondary)] mt-1 text-sm">Set a new goal on the Goals page to see it here.</p></div>`;
        }
        
        const motivationElement = document.getElementById('daily-motivation');
        if (motivationElement) {
            const quotes = ["The secret of getting ahead is getting started.", "The market is a device for transferring money from the impatient to the patient.", "Believe you can and you're halfway there.", "Discipline is the bridge between goals and accomplishment."];
            const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
            motivationElement.textContent = `"${quotes[dayOfYear % quotes.length]}"`;
        }
    }

    // --- ACCOUNTS PAGE (`accounts.html`) --- [LOGIC RESTORED]
    if (currentPage === 'accounts.html') {
        const accountForm = document.getElementById('account-form');
        const accountsListDiv = document.getElementById('accounts-list');
        const emptyState = document.getElementById('accounts-empty-state');

        const renderAccounts = () => {
            const accounts = getStoredData('accounts');
            const journal = getStoredData('journal');
            accountsListDiv.innerHTML = '';
            emptyState.classList.toggle('hidden', accounts.length > 0);
            accountsListDiv.classList.toggle('hidden', accounts.length === 0);

            accounts.forEach(account => {
                const tradesForAccount = journal.filter(j => j.account === account.name);
                const totalPnl = tradesForAccount.reduce((sum, trade) => sum + (parseFloat(trade.pnl) || 0), 0);
                
                const startingBalance = parseFloat(account.startingBalance) || 0;
                const currentBalance = startingBalance + totalPnl;
                const pnlPercentage = startingBalance !== 0 ? (totalPnl / startingBalance) * 100 : 0;

                const pnlColorClass = totalPnl >= 0 ? 'text-green-400' : 'text-red-400';
                const pnlIcon = totalPnl >= 0 ? 'trending-up' : 'trending-down';
                
                // Status Badge Logic
                let statusBadge;
                switch (account.status) {
                    case 'passed':
                        statusBadge = `<span class="text-xs font-medium py-1 px-3 rounded-full bg-blue-900/50 text-blue-300">Passed</span>`;
                        break;
                    case 'failed':
                        statusBadge = `<span class="text-xs font-medium py-1 px-3 rounded-full bg-red-900/50 text-red-300">Failed</span>`;
                        break;
                    default: // active
                        statusBadge = `<span class="text-xs font-medium py-1 px-3 rounded-full bg-green-900/50 text-green-300">Active</span>`;
                }

                // Action buttons for active accounts
                const statusActions = account.status === 'active' ? `
                    <div class="absolute bottom-4 right-4 flex gap-2">
                        <button class="pass-btn p-2 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-400" data-id="${account.id}" title="Mark as Passed"><i data-lucide="check" class="w-4 h-4"></i></button>
                        <button class="fail-btn p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400" data-id="${account.id}" title="Mark as Failed"><i data-lucide="x" class="w-4 h-4"></i></button>
                    </div>
                ` : '';

                const card = document.createElement('div');
                card.className = 'premium-card p-6 flex flex-col gap-4 relative';

                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start">
                            <h3 class="text-xl font-bold mb-2 uppercase">${account.name}</h3>
                            <div class="flex items-center gap-3">
                                <button class="delete-btn text-slate-500 hover:text-red-500" data-id="${account.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            ${statusBadge}
                            ${account.broker ? `<span class="text-xs font-medium py-1 px-3 rounded-full bg-slate-700">${account.broker}</span>` : ''}
                        </div>
                    </div>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between items-center text-[var(--text-secondary)]">
                            <span>Starting Balance</span>
                            <span class="font-semibold text-[var(--text-primary)]">USD ${startingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[var(--text-secondary)]">Current Balance</span>
                            <span class="text-lg font-bold text-[var(--text-primary)]">USD ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <div class="bg-slate-800/50 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <span class="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><i data-lucide="${pnlIcon}" class="w-4 h-4 ${pnlColorClass}"></i> P&L</span>
                            <div class="text-right">
                                <p class="font-bold text-lg ${pnlColorClass}">${totalPnl >= 0 ? '+' : ''}USD ${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p class="text-sm font-medium ${pnlColorClass}">${pnlPercentage.toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>
                    <div class="text-xs text-center text-[var(--text-secondary)] mt-auto pt-4">
                        Created: ${new Date(account.createdAt).toLocaleDateString()}
                    </div>
                    ${statusActions}
                `;
                accountsListDiv.appendChild(card);
            });
            lucide.createIcons();
        };

        accountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const accountName = document.getElementById('account-name').value.trim();
            const accountBroker = document.getElementById('account-broker').value.trim();
            const startingBalance = parseFloat(document.getElementById('account-balance').value);

            if (accountName && !isNaN(startingBalance)) {
                const newAccount = {
                    id: Date.now(),
                    name: accountName,
                    broker: accountBroker,
                    startingBalance: startingBalance,
                    createdAt: new Date().toISOString(),
                    status: 'active' // Default status
                };
                setStoredData('accounts', [...getStoredData('accounts'), newAccount]);
                renderAccounts();
                accountForm.reset();
            } else {
                alert('Please provide a valid account name and starting balance.');
            }
        });

        accountsListDiv.addEventListener('click', (e) => {
            const updateAccountStatus = (btn, newStatus) => {
                const id = parseInt(btn.getAttribute('data-id'));
                const accounts = getStoredData('accounts');
                const accountIndex = accounts.findIndex(acc => acc.id === id);
                if (accountIndex > -1) {
                    accounts[accountIndex].status = newStatus;
                    setStoredData('accounts', accounts);
                    renderAccounts();
                }
            };

            if (e.target.closest('.delete-btn')) {
                const id = parseInt(e.target.closest('.delete-btn').getAttribute('data-id'));
                setStoredData('accounts', getStoredData('accounts').filter(acc => acc.id !== id));
                renderAccounts();
            } else if (e.target.closest('.pass-btn')) {
                updateAccountStatus(e.target.closest('.pass-btn'), 'passed');
            } else if (e.target.closest('.fail-btn')) {
                updateAccountStatus(e.target.closest('.fail-btn'), 'failed');
            }
        });

        document.getElementById('export-data-btn').addEventListener('click', () => {
             const data = { accounts: getStoredData('accounts'), goals: getStoredData('goals'), journal: getStoredData('journal'), payouts: getStoredData('payouts') };
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = `tradex_backup_${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(a.href);
        });
        document.getElementById('import-data-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
        document.getElementById('import-file-input').addEventListener('change', (event) => {
            const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.accounts && data.goals && data.journal && data.payouts) {
                        setStoredData('accounts', data.accounts); setStoredData('goals', data.goals); setStoredData('journal', data.journal); setStoredData('payouts', data.payouts);
                        alert('Data imported successfully! The page will now reload.'); location.reload();
                    } else alert('Error: Invalid file format.');
                } catch (error) { alert('Error reading file.'); }
            };
            reader.readAsText(file); event.target.value = '';
        });
        renderAccounts();
    }
    
    // --- TRADING JOURNAL PAGE (`journal.html`) ---
    if (currentPage === 'journal.html') {
        const journalForm = document.getElementById('journal-form');
        const tableBody = document.getElementById('journal-table-body');
        const emptyState = document.getElementById('journal-empty-state');
        const screenshotInput = document.getElementById('trade-screenshot');
        const screenshotLabel = document.getElementById('screenshot-label');
        const modal = document.getElementById('screenshot-modal');
        const modalImage = document.getElementById('modal-image');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        let screenshotData = null;

        // Filter Elements
        const filterAssetInput = document.getElementById('filter-asset');
        const filterOutcomeSelect = document.getElementById('filter-outcome');
        const filterAccountSelect = document.getElementById('filter-account');
        const clearFiltersBtn = document.getElementById('clear-filters-btn');

        let currentFilters = {
            asset: '',
            outcome: '',
            account: ''
        };

        const formInputs = { account: document.getElementById('trade-account'), asset: document.getElementById('trade-asset'), position: document.getElementById('trade-position'), date: document.getElementById('trade-date'), followedRules: document.getElementById('trade-followed-rules'), balance: document.getElementById('trade-balance'), lotSize: document.getElementById('trade-lot-size'), risk: document.getElementById('trade-risk'), sl: document.getElementById('trade-sl'), tp: document.getElementById('trade-tp'), entry: document.getElementById('trade-entry'), entryTime: document.getElementById('trade-entry-time'), exit: document.getElementById('trade-exit'), exitTime: document.getElementById('trade-exit-time'), pnl: document.getElementById('trade-pnl'), rationale: document.getElementById('trade-rationale') };
        
        screenshotInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    screenshotData = e.target.result;
                    screenshotLabel.textContent = 'Screenshot Added ✓';
                };
                reader.readAsDataURL(file);
            }
        });

        const renderJournalEntries = () => {
            let entries = getStoredData('journal');
            
            // Apply filters
            if (currentFilters.asset) {
                entries = entries.filter(e => e.asset.toLowerCase().includes(currentFilters.asset.toLowerCase()));
            }
            if (currentFilters.outcome) {
                if(currentFilters.outcome === 'win') entries = entries.filter(e => parseFloat(e.pnl) > 0);
                if(currentFilters.outcome === 'loss') entries = entries.filter(e => parseFloat(e.pnl) < 0);
                if(currentFilters.outcome === 'breakeven') entries = entries.filter(e => parseFloat(e.pnl) === 0);
            }
            if (currentFilters.account) {
                entries = entries.filter(e => e.account === currentFilters.account);
            }

            entries.sort((a,b) => new Date(b.date) - new Date(a.date));

            tableBody.innerHTML = '';
            emptyState.classList.toggle('hidden', entries.length > 0);
            tableBody.closest('table').classList.toggle('hidden', entries.length === 0);

            entries.forEach(entry => {
                const pnl = parseFloat(entry.pnl) || 0, pnlClass = pnl >= 0 ? 'text-green-400' : 'text-red-400';
                const rulesClass = entry.followedRules === 'Yes' ? 'text-green-400' : 'text-red-400';
                const rulesIcon = `<i data-lucide="${entry.followedRules === 'Yes' ? 'check-circle' : 'x-circle'}" class="w-4 h-4 inline-block mr-1"></i>`;
                const mainRow = document.createElement('tr');
                mainRow.className = 'border-b border-[var(--border-color)] table-row-hover odd:bg-slate-800/20';
                mainRow.innerHTML = `<td class="px-6 py-4">${new Date(entry.date+'T00:00:00').toLocaleDateString()}</td><td class="px-6 py-4 font-medium">${entry.asset}</td><td class="px-6 py-4">${entry.position}</td><td class="px-6 py-4 font-semibold ${pnlClass}">${pnl>=0?'':'-'}$${Math.abs(pnl).toFixed(2)}</td><td class="px-6 py-4 ${rulesClass}">${rulesIcon}${entry.followedRules}</td><td class="px-6 py-4 text-center"><button class="toggle-details-btn text-[var(--text-secondary)] hover:text-white" data-target-id="details-${entry.id}"><i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i></button></td><td class="px-6 py-4 text-right"><button class="delete-btn text-slate-500 hover:text-red-500" data-id="${entry.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>`;
                
                const screenshotButton = entry.screenshot ? `<button class="btn btn-secondary text-xs py-1 px-2 view-screenshot-btn" data-entry-id="${entry.id}">View Screenshot</button>` : '';

                const detailsRow = document.createElement('tr');
                detailsRow.id = `details-${entry.id}`; detailsRow.className = 'hidden bg-slate-800/50';
                detailsRow.innerHTML = `<td colspan="7" class="p-0"><div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4"><div class="space-y-2 text-sm"><h4 class="font-semibold border-b border-slate-700 pb-1 mb-2">Entry & Exit</h4><p><strong class="text-[var(--text-secondary)]">Entry:</strong> ${entry.entry||'N/A'} at ${entry.entryTime||'N/A'}</p><p><strong class="text-[var(--text-secondary)]">Exit:</strong> ${entry.exit||'N/A'} at ${entry.exitTime||'N/A'}</p><p><strong class="text-[var(--text-secondary)]">SL / TP:</strong> ${entry.sl||'N/A'} / ${entry.tp||'N/A'}</p></div><div class="space-y-2 text-sm"><h4 class="font-semibold border-b border-slate-700 pb-1 mb-2">Risk & Position</h4><p><strong class="text-[var(--text-secondary)]">Lot Size:</strong> ${entry.lotSize||'N/A'}</p><p><strong class="text-[var(--text-secondary)]">% Risked:</strong> ${entry.risk||'N/A'}%</p><p><strong class="text-[var(--text-secondary)]">Account:</strong> ${entry.account}</p><p><strong class="text-[var(--text-secondary)]">Closing Balance:</strong> $${parseFloat(entry.balance).toFixed(2)}</p></div><div class="space-y-2 md:col-span-1 text-sm"><h4 class="font-semibold border-b border-slate-700 pb-1 mb-2">Details</h4><p class="whitespace-pre-wrap mb-3">${entry.rationale}</p>${screenshotButton}</div></div></td>`;
                tableBody.append(mainRow, detailsRow);
            });
            lucide.createIcons();
        };

        journalForm.addEventListener('submit', (e) => { e.preventDefault(); const data = {}; Object.keys(formInputs).forEach(k => data[k] = formInputs[k].value); if (screenshotData) data.screenshot = screenshotData; setStoredData('journal', [...getStoredData('journal'), { id: Date.now(), ...data }]); renderJournalEntries(); journalForm.reset(); screenshotData = null; screenshotLabel.textContent = 'Add Screenshot'; });
        
        tableBody.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            const detailsBtn = e.target.closest('.toggle-details-btn');
            const screenshotBtn = e.target.closest('.view-screenshot-btn');

            if (deleteBtn) { setStoredData('journal', getStoredData('journal').filter(entry => entry.id !== parseInt(deleteBtn.dataset.id))); renderJournalEntries(); }
            if (detailsBtn) { document.getElementById(detailsBtn.dataset.targetId)?.classList.toggle('hidden'); detailsBtn.querySelector('svg')?.classList.toggle('rotate-180'); }
            if (screenshotBtn) {
                const entryId = parseInt(screenshotBtn.dataset.entryId);
                const entries = getStoredData('journal');
                const entry = entries.find(e => e.id === entryId);
                if (entry && entry.screenshot) {
                    modalImage.src = entry.screenshot;
                    modal.classList.remove('hidden');
                }
            }
        });

        // Filter event listeners
        filterAssetInput.addEventListener('input', (e) => { currentFilters.asset = e.target.value; renderJournalEntries(); });
        filterOutcomeSelect.addEventListener('change', (e) => { currentFilters.outcome = e.target.value; renderJournalEntries(); });
        filterAccountSelect.addEventListener('change', (e) => { currentFilters.account = e.target.value; renderJournalEntries(); });
        clearFiltersBtn.addEventListener('click', () => {
            currentFilters = { asset: '', outcome: '', account: '' };
            filterAssetInput.value = '';
            filterOutcomeSelect.value = '';
            filterAccountSelect.value = '';
            renderJournalEntries();
        });

        const closeModal = () => modal.classList.add('hidden');
        modalCloseBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        document.getElementById('export-journal-csv').addEventListener('click', () => {
            const entries = getStoredData('journal'); if (entries.length === 0) return alert('No entries to export.');
            const headers = ['ID', 'Date', 'Account', 'Asset', 'Position', 'Entry Price', 'Entry Time', 'Exit Price', 'Exit Time', 'SL', 'TP', 'Lot Size', '% Risked', 'Rules Followed', 'Closing Balance', 'P/L', 'Rationale'];
            const csv = [headers.join(','), ...entries.map(e => [e.id,e.date,e.account,e.asset,e.position,e.entry||'',e.entryTime||'',e.exit||'',e.exitTime||'',e.sl||'',e.tp||'',e.lotSize||'',e.risk||'',e.followedRules,e.balance,e.pnl,`"${(e.rationale||'').replace(/"/g,'""')}"`].join(','))].join('\n');
            const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csv); link.download = `tradex_journal_${new Date().toISOString().split('T')[0]}.csv`; link.click(); link.remove();
        });

        populateAccountDropdown(formInputs.account);
        populateAccountDropdown(filterAccountSelect);
        renderJournalEntries();
    }
    
    // --- GOALS PAGE (`goals.html`) --- [LOGIC RESTORED]
    if (currentPage === 'goals.html') {
        const goalForm = document.getElementById('goal-form');
        const goalsListDiv = document.getElementById('goals-list');
        const emptyState = document.getElementById('goals-empty-state');
        let currentFilter = 'all';

        const renderGoals = () => {
            let goals = getStoredData('goals').sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
            if (currentFilter === 'active') goals = goals.filter(g => !g.completed);
            if (currentFilter === 'completed') goals = goals.filter(g => g.completed);
            goalsListDiv.innerHTML = '';
            emptyState.classList.toggle('hidden', goals.length > 0);
            goalsListDiv.classList.toggle('hidden', goals.length === 0);
            goals.forEach(goal => {
                const deadline = new Date(goal.deadline+'T23:59:59'), diffDays = Math.ceil((deadline - new Date()) / 86400000);
                let countdownText = deadline < new Date() ? 'Overdue' : `${diffDays} day${diffDays!==1?'s':''} left`;
                const card = document.createElement('div');
                card.className = `premium-card p-6 ${goal.completed ? 'opacity-60' : ''}`;
                card.innerHTML = `<div class="flex justify-between items-start"><p class="font-semibold text-lg mb-2 ${goal.completed?'line-through':''}">${goal.description}</p><button class="delete-btn text-slate-500 hover:text-red-500" data-id="${goal.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div><div class="flex items-center justify-between text-sm mt-4"><span class="text-xs font-medium py-1 px-2 rounded-full ${deadline < new Date() && !goal.completed ? 'bg-red-900/50 text-red-300' : 'bg-slate-700'}">${countdownText}</span><label class="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]"><input type="checkbox" class="goal-status w-4 h-4 bg-slate-800 border-slate-600 rounded" data-id="${goal.id}" ${goal.completed?'checked':''}> Complete</label></div>`;
                goalsListDiv.appendChild(card);
            });
            lucide.createIcons();
        };

        goalForm.addEventListener('submit', (e) => {
             e.preventDefault(); 
             const desc = document.getElementById('goal-description').value.trim();
             const dead = document.getElementById('goal-deadline').value; 
             if (desc && dead) { 
                 setStoredData('goals', [...getStoredData('goals'), { id: Date.now(), description: desc, deadline: dead, completed: false }]); 
                 renderGoals(); 
                 goalForm.reset(); 
             } 
        });
        goalsListDiv.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (e.target.classList.contains('goal-status')) {
                const goals = getStoredData('goals'), goal = goals.find(g => g.id === id);
                if (goal) { goal.completed = !goal.completed; if (goal.completed && typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }}); }
                setStoredData('goals', goals); renderGoals();
            } else if (e.target.closest('.delete-btn')) { 
                setStoredData('goals', getStoredData('goals').filter(g => g.id !== parseInt(e.target.closest('.delete-btn').dataset.id))); 
                renderGoals(); 
            }
        });
        document.querySelectorAll('[id^="filter-goals-"]').forEach(btn => btn.addEventListener('click', () => { 
            document.querySelector('[id^="filter-goals-"].bg-\\[var\\(--accent-color\\)\\]').classList.replace('bg-[var(--accent-color)]', 'bg-slate-700'); 
            btn.classList.replace('bg-slate-700', 'bg-[var(--accent-color)]'); 
            currentFilter = btn.id.split('-').pop(); 
            renderGoals(); 
        }));
        renderGoals();
    }
    
    // --- PAYOUTS PAGE (`payouts.html`) ---
    if (currentPage === 'payouts.html') {
        const payoutForm = document.getElementById('payout-form'), payoutsListDiv = document.getElementById('payouts-list'), emptyState = document.getElementById('payouts-empty-state'), payoutAccountFilter = document.getElementById('payout-account-filter');
        const summaryTotalEl = document.getElementById('summary-total-payouts'), summaryCountEl = document.getElementById('summary-payout-count'), summaryAvgEl = document.getElementById('summary-avg-payout');
        
        const renderPayouts = (selectedAccount = '') => {
            const payouts = getStoredData('payouts');
            const filteredPayouts = (selectedAccount ? payouts.filter(p => p.account === selectedAccount) : payouts).sort((a,b) => new Date(b.date) - new Date(a.date));
            payoutsListDiv.innerHTML = '';
            emptyState.classList.toggle('hidden', filteredPayouts.length > 0);
            
            filteredPayouts.forEach(payout => {
                const item = document.createElement('div');
                item.className = 'premium-card p-4 flex justify-between items-center';
                item.innerHTML = `<div><span class="font-semibold text-green-400 text-lg">$${(parseFloat(payout.amount)||0).toFixed(2)}</span><span class="text-[var(--text-secondary)] text-sm ml-2">from ${payout.account}</span></div><div class="text-right"><span class="text-[var(--text-secondary)] text-sm">${new Date(payout.date+'T00:00:00').toLocaleDateString()}</span><button class="delete-btn ml-4 text-slate-500 hover:text-red-500" data-id="${payout.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`;
                payoutsListDiv.appendChild(item);
            });
            lucide.createIcons();
            
            const total = filteredPayouts.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            const count = filteredPayouts.length;
            animateCounter(summaryTotalEl, total);
            animateCounter(summaryCountEl, count);
            animateCounter(summaryAvgEl, count > 0 ? total / count : 0);
        };
    
        payoutForm.addEventListener('submit', (e) => { e.preventDefault(); const data = { id: Date.now(), account: document.getElementById('payout-account').value, amount: document.getElementById('payout-amount').value, date: document.getElementById('payout-date').value }; if (data.account && data.amount && data.date) { setStoredData('payouts', [...getStoredData('payouts'), data]); renderPayouts(payoutAccountFilter.value); payoutForm.reset(); } });
        payoutsListDiv.addEventListener('click', (e) => { if (e.target.closest('.delete-btn')) { setStoredData('payouts', getStoredData('payouts').filter(p => p.id !== parseInt(e.target.closest('.delete-btn').dataset.id))); renderPayouts(payoutAccountFilter.value); } });
        payoutAccountFilter.addEventListener('change', (e) => renderPayouts(e.target.value));
        populateAccountDropdown(document.getElementById('payout-account')); populateAccountDropdown(payoutAccountFilter);
        renderPayouts(payoutAccountFilter.value);
    }
    
    // --- ANALYSIS PAGE (`analysis.html`) ---
    if (currentPage === 'analysis.html') {
        const container = document.getElementById('analysis-container'), filterSelect = document.getElementById('account-filter');
        let charts = [];
        const renderAnalysis = (account) => {
            charts.forEach(c => c.destroy()); charts = [];
            const trades = account ? getStoredData('journal').filter(t => t.account === account) : getStoredData('journal');
            if (trades.length === 0) {
                container.innerHTML = `<div class="text-center py-16 px-6 bg-[var(--secondary-color)] rounded-xl border border-[var(--border-color)]"><svg class="mx-auto h-24 w-24 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg><h3 class="mt-4 text-xl font-bold">Not Enough Data</h3><p class="text-[var(--text-secondary)] mt-2">Analysis for '${account || 'All Accounts'}' will appear here once you log trades.</p></div>`; return;
            }
            let pnl=0, gP=0, gL=0, w=0, l=0, b=0; trades.forEach(t => { const p=parseFloat(t.pnl)||0; pnl+=p; if(p>0){w++; gP+=p;} else if(p<0){l++; gL+=Math.abs(p);} else{b++;} });
            const wR = (w+l)>0 ? (w/(w+l))*100:0, pF = gL>0?gP/gL:Infinity;
            container.innerHTML = `<div class="mb-6 border-b border-[var(--border-color)]"><nav class="flex space-x-4" id="analysis-tabs"><button data-tab="overview" class="tab-btn font-medium py-2 px-1 border-b-2 border-[var(--accent-color)] text-[var(--text-primary)]">Overview</button><button data-tab="equity" class="tab-btn font-medium py-2 px-1 border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Equity Curve</button><button data-tab="assets" class="tab-btn font-medium py-2 px-1 border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Assets</button></nav></div><div id="tab-content"><div id="tab-overview" class="tab-pane"><div class="grid grid-cols-2 md:grid-cols-4 gap-6"><div class="premium-card p-6 text-center"><p class="text-sm text-[var(--text-secondary)]">Total P/L</p><p class="text-2xl font-bold ${pnl>=0?'text-green-400':'text-red-400'}">$${pnl.toFixed(2)}</p></div><div class="premium-card p-6 text-center"><p class="text-sm text-[var(--text-secondary)]">Win Rate</p><p class="text-2xl font-bold">${wR.toFixed(1)}%</p></div><div class="premium-card p-6 text-center"><p class="text-sm text-[var(--text-secondary)]">Profit Factor</p><p class="text-2xl font-bold">${pF===Infinity?'N/A':pF.toFixed(2)}</p></div><div class="premium-card p-6 text-center"><p class="text-sm text-[var(--text-secondary)]">Total Trades</p><p class="text-2xl font-bold">${trades.length}</p></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"><div class="premium-card p-4 h-80"><canvas id="winLossChart"></canvas></div><div class="premium-card p-4 h-80"><canvas id="positionDistributionChart"></canvas></div></div></div><div id="tab-equity" class="tab-pane hidden"><div class="premium-card p-6 h-96"><canvas id="pnlOverTimeChart"></canvas></div></div><div id="tab-assets" class="tab-pane hidden"><div class="premium-card p-6"><canvas id="assetDistributionChart"></canvas></div></div></div>`;
            
            const isLight = document.documentElement.classList.contains('light'); Chart.defaults.color=isLight?'#475569':'#94a3b8'; Chart.defaults.borderColor=isLight?'#e2e8f0':'#334155';
            const sorted = [...trades].sort((a,b)=>new Date(a.date)-new Date(b.date)); let cPnl=0; const pnlData = sorted.map(t=>{cPnl+=parseFloat(t.pnl)||0; return cPnl;});
            const ctx = document.getElementById('pnlOverTimeChart').getContext('2d'), grad = ctx.createLinearGradient(0,0,0,400); grad.addColorStop(0,'rgba(59,130,246,0.5)'); grad.addColorStop(1,'rgba(59,130,246,0)');
            charts.push(new Chart(ctx, {type:'line', data:{labels:sorted.map((_,i)=>`T${i+1}`), datasets:[{label:'Cumulative P/L',data:pnlData,borderColor:'#3b82f6',backgroundColor:grad,tension:0.4,fill:true}]}, options:{maintainAspectRatio:false,scales:{y:{beginAtZero:false}}}}));
            charts.push(new Chart(document.getElementById('winLossChart').getContext('2d'), {type:'doughnut',data:{labels:['Wins','Losses','Breakeven'],datasets:[{data:[w,l,b],backgroundColor:['#22c55e','#ef4444','#64748b'],borderWidth:0}]},options:{maintainAspectRatio:false,plugins:{legend:{position:'top'}}}}));
            const long=trades.filter(t=>t.position==='Long').length, short=trades.filter(t=>t.position==='Short').length;
            charts.push(new Chart(document.getElementById('positionDistributionChart').getContext('2d'), {type:'pie',data:{labels:['Long','Short'],datasets:[{data:[long,short],backgroundColor:['rgba(34,197,94,0.7)','rgba(239,68,68,0.7)'],borderColor:'#161b22',borderWidth:2}]},options:{maintainAspectRatio:false,plugins:{legend:{position:'top'}}}}));
            const assetCounts = trades.reduce((acc,t)=>{const a=(t.asset||'N/A').toUpperCase(); acc[a]=(acc[a]||0)+1; return acc;},{});
            charts.push(new Chart(document.getElementById('assetDistributionChart').getContext('2d'), {type:'bar',data:{labels:Object.keys(assetCounts),datasets:[{label:'# Trades',data:Object.values(assetCounts),backgroundColor:'rgba(59,130,246,0.7)',borderRadius:4}]},options:{maintainAspectRatio:false,indexAxis:'y',scales:{x:{beginAtZero:true}},plugins:{legend:{display:false}}}}));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => { document.querySelector('.tab-btn.border-\\[var\\(--accent-color\\)\\]')?.classList.replace('border-[var(--accent-color)]','border-transparent'); document.querySelector('.tab-btn.text-\\[var\\(--text-primary\\)\\]')?.classList.replace('text-[var(--text-primary)]','text-[var(--text-secondary)]'); btn.classList.replace('border-transparent','border-[var(--accent-color)]'); btn.classList.replace('text-[var(--text-secondary)]','text-[var(--text-primary)]'); document.querySelectorAll('.tab-pane').forEach(p=>p.classList.add('hidden')); document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden'); }));
        };
        filterSelect.addEventListener('change', (e) => renderAnalysis(e.target.value));
        populateAccountDropdown(filterSelect); renderAnalysis(filterSelect.value);
    }
});