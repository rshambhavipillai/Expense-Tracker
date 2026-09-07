const STORAGE_KEY = "spendly-expenses";

const form = document.querySelector("#expense-form");
const dateInput = document.querySelector("#date");
const expenseList = document.querySelector("#expense-list");
const emptyState = document.querySelector("#empty-state");
const totalAmount = document.querySelector("#total-amount");
const expenseCount = document.querySelector("#expense-count");
const clearAllButton = document.querySelector("#clear-all");
const feedback = document.querySelector("#form-feedback");
const expenseTemplate = document.querySelector("#expense-template");

let expenses = loadExpenses();

dateInput.value = new Date().toISOString().slice(0, 10);
renderExpenses();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const amount = Number(formData.get("amount"));

  if (!Number.isFinite(amount) || amount <= 0) {
    showFeedback("Enter an amount greater than zero.", true);
    return;
  }

  const expense = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    description: String(formData.get("description")).trim(),
    amount: Math.round(amount * 100) / 100,
    date: String(formData.get("date")),
    category: String(formData.get("category")),
  };

  expenses = [expense, ...expenses];
  saveExpenses();
  renderExpenses();
  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  showFeedback("Expense added.");
});

clearAllButton.addEventListener("click", () => {
  if (expenses.length === 0 || !window.confirm("Remove all expenses?")) {
    return;
  }

  expenses = [];
  saveExpenses();
  renderExpenses();
  showFeedback("All expenses cleared.");
});

function loadExpenses() {
  try {
    const storedExpenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(storedExpenses) ? storedExpenses : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function renderExpenses() {
  expenseList.replaceChildren();

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  totalAmount.textContent = formatCurrency(total);
  expenseCount.textContent = `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"}`;
  emptyState.hidden = expenses.length > 0;
  clearAllButton.hidden = expenses.length === 0;

  expenses.forEach((expense) => {
    const item = expenseTemplate.content.cloneNode(true);
    const article = item.querySelector(".expense-item");
    const categoryIcon = item.querySelector(".category-icon");
    const description = item.querySelector(".expense-description");
    const meta = item.querySelector(".expense-meta");
    const amount = item.querySelector(".expense-amount");
    const deleteButton = item.querySelector(".delete-button");

    categoryIcon.textContent = categoryInitial(expense.category);
    categoryIcon.setAttribute("aria-label", expense.category);
    description.textContent = expense.description;
    meta.textContent = `${expense.category} · ${formatDate(expense.date)}`;
    amount.textContent = formatCurrency(Number(expense.amount));
    deleteButton.setAttribute("aria-label", `Remove ${expense.description}`);
    deleteButton.addEventListener("click", () => removeExpense(expense.id));
    article.dataset.expenseId = expense.id;

    expenseList.append(item);
  });
}

function removeExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  renderExpenses();
  showFeedback("Expense removed.");
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function categoryInitial(category) {
  return category.slice(0, 1).toUpperCase();
}

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.style.color = isError ? "var(--danger)" : "var(--accent)";
}
