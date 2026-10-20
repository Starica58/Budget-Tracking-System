
const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("budgetInput");
const transactionForm = document.getElementById("transactionForm");

const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");

const totalBudgetEl = document.getElementById("totalBudget");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const remainingBalanceEl = document.getElementById("remainingBalance");

const transactionList = document.getElementById("transactionList");
const emptyMessage = document.getElementById("emptyMessage");

// Load saved data from the browser
let budget = Number(localStorage.getItem("budget")) || 0;

let transactions = [];

try {
    const savedTransactions = JSON.parse(
        localStorage.getItem("transactions") || "[]"
    );

    if (Array.isArray(savedTransactions)) {
        transactions = savedTransactions.filter(item =>
            item &&
            typeof item.id === "number" &&
            typeof item.description === "string" &&
            Number.isFinite(item.amount) &&
            item.amount > 0 &&
            ["income", "expense"].includes(item.type) &&
            typeof item.date === "string"
        );
    }
} catch {
    transactions = [];
}

// Format amounts in Philippine pesos
function formatMoney(amount) {
    return amount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP"
    });
}

// Save data locally
function saveData() {
    localStorage.setItem("budget", String(budget));
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

// Update the dashboard
function updateDashboard() {
    const totalIncome = transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const totalExpenses = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    // Budget plus income, minus expenses
    const remainingBalance = budget + totalIncome - totalExpenses;

    totalBudgetEl.textContent = formatMoney(budget);
    totalIncomeEl.textContent = formatMoney(totalIncome);
    totalExpensesEl.textContent = formatMoney(totalExpenses);
    remainingBalanceEl.textContent = formatMoney(remainingBalance);

    remainingBalanceEl.style.color =
        remainingBalance < 0 ? "#dc3545" : "#2563eb";

    renderTransactions();
}

// Set the budget
budgetForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const newBudget = Number(budgetInput.value);

    if (!Number.isFinite(newBudget) || newBudget <= 0) {
        alert("Please enter a valid budget greater than zero.");
        return;
    }

    budget = newBudget;
    saveData();
    updateDashboard();

    budgetInput.value = "";
});

// Add a new transaction
transactionForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;

    if (
        !description ||
        description.length > 100 ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !["income", "expense"].includes(type)
    ) {
        alert("Please enter a valid description and amount.");
        return;
    }

    const transaction = {
        id: Date.now(),
        description: description,
        amount: amount,
        type: type,
        date: new Date().toLocaleDateString("en-PH")
    };

    transactions.push(transaction);

    saveData();
    updateDashboard();
    transactionForm.reset();
});

// Display the transaction history
function renderTransactions() {
    transactionList.replaceChildren();

    emptyMessage.style.display =
        transactions.length === 0 ? "block" : "none";

    // Show newest transactions first
    [...transactions].reverse().forEach(function(item) {
        const row = document.createElement("tr");

        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = item.description;

        const typeCell = document.createElement("td");
        typeCell.textContent =
            item.type.charAt(0).toUpperCase() + item.type.slice(1);

        typeCell.className =
            item.type === "income" ? "income-text" : "expense-text";

        const amountCell = document.createElement("td");
        const sign = item.type === "income" ? "+" : "-";
        amountCell.textContent = sign + formatMoney(item.amount);
        amountCell.className = typeCell.className;

        const dateCell = document.createElement("td");
        dateCell.textContent = item.date;

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";
        deleteButton.setAttribute(
            "aria-label",
            "Delete transaction: " + item.description
        );

        deleteButton.addEventListener("click", function() {
            if (confirm("Delete this transaction?")) {
                transactions = transactions.filter(
                    transaction => transaction.id !== item.id
                );

                saveData();
                updateDashboard();
            }
        });

        actionCell.appendChild(deleteButton);

        row.append(
            descriptionCell,
            typeCell,
            amountCell,
            dateCell,
            actionCell
        );

        transactionList.appendChild(row);
    });
}

// Show saved budget and transactions when the page opens
budgetInput.placeholder = budget > 0
    ? "Current budget: " + formatMoney(budget)
    : "Enter your total budget";

updateDashboard();
