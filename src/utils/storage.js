import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to generate unique IDs
const generateUniqueId = () => {
  return Date.now().toString();
};

// Budget-related storage functions
export const saveBudget = async (budget) => {
  try {
    // Retrieve existing budgets
    const existingBudgetsJson = await AsyncStorage.getItem('budgets');
    const existingBudgets = existingBudgetsJson ? JSON.parse(existingBudgetsJson) : [];

    // Check if a budget for this category already exists
    const existingBudgetIndex = existingBudgets.findIndex(
      b => b.category === budget.category
    );

    if (existingBudgetIndex !== -1) {
      // Update existing budget
      existingBudgets[existingBudgetIndex] = {
        ...existingBudgets[existingBudgetIndex],
        amount: budget.amount,
        spentAmount: existingBudgets[existingBudgetIndex].spentAmount || 0
      };
    } else {
      // Add new budget with a unique ID and initial spentAmount
      budget.id = generateUniqueId();
      budget.spentAmount = 0;
      existingBudgets.push(budget);
    }

    // Save updated budgets
    await AsyncStorage.setItem('budgets', JSON.stringify(existingBudgets));
    return existingBudgets;
  } catch (error) {
    console.error('Error saving budget:', error);
    throw error;
  }
};

export const getBudgets = async () => {
  try {
    const budgetsJson = await AsyncStorage.getItem('budgets');
    return budgetsJson ? JSON.parse(budgetsJson) : [];
  } catch (error) {
    console.error('Error getting budgets:', error);
    return [];
  }
};

export const updateBudget = async (budgetId, updatedBudget) => {
  try {
    const existingBudgetsJson = await AsyncStorage.getItem('budgets');
    let existingBudgets = existingBudgetsJson ? JSON.parse(existingBudgetsJson) : [];

    const budgetIndex = existingBudgets.findIndex(b => b.id === budgetId);
    if (budgetIndex !== -1) {
      existingBudgets[budgetIndex] = {
        ...existingBudgets[budgetIndex],
        ...updatedBudget
      };

      await AsyncStorage.setItem('budgets', JSON.stringify(existingBudgets));
    }
    return existingBudgets;
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
};

export const deleteBudget = async (budgetId) => {
  try {
    const existingBudgetsJson = await AsyncStorage.getItem('budgets');
    let existingBudgets = existingBudgetsJson ? JSON.parse(existingBudgetsJson) : [];

    existingBudgets = existingBudgets.filter(b => b.id !== budgetId);

    await AsyncStorage.setItem('budgets', JSON.stringify(existingBudgets));
    return existingBudgets;
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};

// Expense-related storage functions
export const saveExpense = async (expense) => {
  try {
    // Retrieve existing expenses
    const existingExpensesJson = await AsyncStorage.getItem('expenses');
    const existingExpenses = existingExpensesJson ? JSON.parse(existingExpensesJson) : [];

    // Add unique ID to the expense
    expense.id = generateUniqueId();

    // Add the new expense
    const updatedExpenses = [...existingExpenses, expense];
    await AsyncStorage.setItem('expenses', JSON.stringify(updatedExpenses));

    // Update budget spent amount
    await updateBudgetSpentAmount(expense.category, expense.amount);

    return updatedExpenses;
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
};

export const getExpenses = async () => {
  try {
    const expensesJson = await AsyncStorage.getItem('expenses');
    return expensesJson ? JSON.parse(expensesJson) : [];
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

export const updateExpense = async (expenseId, updatedExpense) => {
  try {
    const existingExpensesJson = await AsyncStorage.getItem('expenses');
    let existingExpenses = existingExpensesJson ? JSON.parse(existingExpensesJson) : [];

    const expenseIndex = existingExpenses.findIndex(e => e.id === expenseId);
    if (expenseIndex !== -1) {
      const oldExpense = existingExpenses[expenseIndex];
      
      // Update the expense
      existingExpenses[expenseIndex] = {
        ...oldExpense,
        ...updatedExpense
      };

      await AsyncStorage.setItem('expenses', JSON.stringify(existingExpenses));

      // Adjust budget spent amount
      if (oldExpense.category !== updatedExpense.category) {
        // If category changed, adjust both old and new category budgets
        await updateBudgetSpentAmount(oldExpense.category, -oldExpense.amount);
        await updateBudgetSpentAmount(updatedExpense.category, updatedExpense.amount);
      } else {
        // If same category, adjust the difference
        await updateBudgetSpentAmount(
          updatedExpense.category, 
          updatedExpense.amount - oldExpense.amount
        );
      }
    }
    return existingExpenses;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    const existingExpensesJson = await AsyncStorage.getItem('expenses');
    let existingExpenses = existingExpensesJson ? JSON.parse(existingExpensesJson) : [];

    const expenseToDelete = existingExpenses.find(e => e.id === expenseId);
    
    // Remove the expense
    existingExpenses = existingExpenses.filter(e => e.id !== expenseId);
    await AsyncStorage.setItem('expenses', JSON.stringify(existingExpenses));

    // Update budget spent amount
    if (expenseToDelete) {
      await updateBudgetSpentAmount(expenseToDelete.category, -expenseToDelete.amount);
    }

    return existingExpenses;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Helper function to update budget spent amount
const updateBudgetSpentAmount = async (category, amount) => {
  try {
    const existingBudgetsJson = await AsyncStorage.getItem('budgets');
    let existingBudgets = existingBudgetsJson ? JSON.parse(existingBudgetsJson) : [];

    const budgetIndex = existingBudgets.findIndex(b => b.category === category);
    if (budgetIndex !== -1) {
      // Update spent amount, ensuring it doesn't go negative
      existingBudgets[budgetIndex].spentAmount = Math.max(
        0, 
        (existingBudgets[budgetIndex].spentAmount || 0) + amount
      );

      await AsyncStorage.setItem('budgets', JSON.stringify(existingBudgets));
    }
  } catch (error) {
    console.error('Error updating budget spent amount:', error);
    throw error;
  }
};

// Function to calculate total budget
export const calculateTotalBudget = async () => {
  try {
    const budgets = await getBudgets();
    return budgets.reduce((total, budget) => total + budget.amount, 0);
  } catch (error) {
    console.error('Error calculating total budget:', error);
    return 0;
  }
};

// Function to get total expenses for a specific category or all categories
export const calculateTotalExpenses = async (category = null) => {
  try {
    const expenses = await getExpenses();
    return expenses
      .filter(expense => category ? expense.category === category : true)
      .reduce((total, expense) => total + expense.amount, 0);
  } catch (error) {
    console.error('Error calculating total expenses:', error);
    return 0;
  }
};

// Add these functions to your storage utilities
export const addRecurringBudget = async (budget) => {
  try {
    // Logic to handle recurring budget creation
    const budgets = await getBudgets();
    budgets.push(budget);
    await AsyncStorage.setItem('budgets', JSON.stringify(budgets));
  } catch (error) {
    console.error('Error adding recurring budget', error);
  }
};

export const checkAndAddRecurringBudgets = async () => {
  try {
    const budgets = await getBudgets();
    const currentDate = new Date();

    const updatedBudgets = budgets.flatMap(budget => {
      if (!budget.recurrenceType || budget.recurrenceType === 'None') return [budget];

      const recurringBudgets = [];
      let nextOccurrence = new Date(budget.date);

      // Determine next occurrence based on recurrence type
      switch (budget.recurrenceType) {
        case 'Daily':
          nextOccurrence.setDate(nextOccurrence.getDate() + 1);
          break;
        case 'Weekly':
          nextOccurrence.setDate(nextOccurrence.getDate() + 7);
          break;
        case 'Monthly':
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
          break;
        case 'Quarterly':
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 3);
          break;
        case 'Annually':
          nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
          break;
      }

      // Check if recurrence duration is set and not exceeded
      if (budget.recurrenceDuration) {
        // Decrement recurrence duration
        budget.recurrenceDuration -= 1;
        
        if (budget.recurrenceDuration > 0) {
          const newRecurringBudget = {
            ...budget,
            date: nextOccurrence.toISOString(),
          };
          recurringBudgets.push(newRecurringBudget);
        }
      } else {
        // If no duration specified, continue recurring
        const newRecurringBudget = {
          ...budget,
          date: nextOccurrence.toISOString(),
        };
        recurringBudgets.push(newRecurringBudget);
      }

      return [budget, ...recurringBudgets];
    });

    // Save updated budgets
    await AsyncStorage.setItem('budgets', JSON.stringify(updatedBudgets));
    return updatedBudgets;
  } catch (error) {
    console.error('Error checking recurring budgets', error);
    return [];
  }
};

// In storage.js
export const saveRecurringExpense = async (recurringExpense) => {
  try {
    const existingRecurringExpenses = await AsyncStorage.getItem('recurringExpenses');
    const recurringExpenses = existingRecurringExpenses 
      ? JSON.parse(existingRecurringExpenses) 
      : [];
    
    recurringExpense.id = Date.now().toString(); // Generate unique ID
    recurringExpenses.push(recurringExpense);
    
    await AsyncStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
    return recurringExpense;
  } catch (error) {
    console.error('Error saving recurring expense:', error);
    throw error;
  }
};

export const getRecurringExpenses = async () => {
  try {
    const recurringExpenses = await AsyncStorage.getItem('recurringExpenses');
    return recurringExpenses ? JSON.parse(recurringExpenses) : [];
  } catch (error) {
    console.error('Error getting recurring expenses:', error);
    return [];
  }
};

export const deleteRecurringExpense = async (id) => {
  try {
    const existingRecurringExpenses = await AsyncStorage.getItem('recurringExpenses');
    const recurringExpenses = existingRecurringExpenses 
      ? JSON.parse(existingRecurringExpenses) 
      : [];
    
    const updatedRecurringExpenses = recurringExpenses.filter(expense => expense.id !== id);
    
    await AsyncStorage.setItem('recurringExpenses', JSON.stringify(updatedRecurringExpenses));
  } catch (error) {
    console.error('Error deleting recurring expense:', error);
    throw error;
  }
};

export const updateRecurringExpense = async (id, updatedExpense) => {
  try {
    const existingRecurringExpenses = await AsyncStorage.getItem('recurringExpenses');
    const recurringExpenses = existingRecurringExpenses 
      ? JSON.parse(existingRecurringExpenses) 
      : [];
    
    const updatedRecurringExpenses = recurringExpenses.map(expense => 
      expense.id === id ? { ...expense, ...updatedExpense } : expense
    );
    
    await AsyncStorage.setItem('recurringExpenses', JSON.stringify(updatedRecurringExpenses));
  } catch (error) {
    console.error('Error updating recurring expense:', error);
    throw error;
  }
};

// // Clear all data (use with caution)
// export const clearAllData = async () => {
//   try {
//     await AsyncStorage.removeItem('budgets');
//     await AsyncStorage.removeItem('expenses');
//   } catch (error) {
//     console.error('Error clearing data:', error);
//   }
// };

// clearAllData();
