import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Modal,
  ScrollView,
  Alert,
  AppState
} from 'react-native';
import { saveExpense, getExpenses, deleteExpense, updateExpense } from '../utils/storage';
import { getBudgets, updateBudget } from '../utils/storage';

const ExpenseScreen = () => {
  // Use budget categories from Budget Screen
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // Colors (unchanged)
  const colors = {
    background: '#16161A',
    text: '#7F5AF0',
    input: '#2CB67D',
    button: '#2CB67D',
    accent: '#7F5AF0',
    delete: '#FF6B6B',
    edit: '#FFA500',
    info: '#4A90E2',
  };

  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  
  // State for Info Modal
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const savedExpenses = await getExpenses();
    setExpenses(savedExpenses);
  };

  // Function to handle showing expense info
  const handleShowExpenseInfo = (expense) => {
    setSelectedExpense(expense);
    setIsInfoModalVisible(true);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    try {
      // Load budgets to get categories
      const savedBudgets = await getBudgets();
      
      // Ensure savedBudgets is an array and not null/undefined
      const validBudgets = savedBudgets || [];
      
      // Set budgets state
      setBudgets(validBudgets);
  
      // Extract unique categories from budgets, ensuring it's always an array
      const categories = validBudgets.length > 0 
        ? [...new Set(validBudgets.map(budget => budget.category).filter(Boolean))] 
        : [];
      
      // Set budget categories state
      setBudgetCategories(categories);
  
      // Load expenses
      const savedExpenses = await getExpenses();
      setExpenses(savedExpenses || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load initial data');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseName || !expenseAmount || !expenseCategory) {
      Alert.alert('Invalid Input', 'Please enter expense name, amount, and select a category');
      return;
    }

    const currentDate = new Date();
    const amountNum = parseFloat(expenseAmount);

    // Find the corresponding budget for the selected category
    const matchingBudget = budgets.find(budget => budget.category === expenseCategory);

    if (!matchingBudget) {
      Alert.alert('Budget Not Found', 'Please create a budget for this category first');
      return;
    }

    // Check if expense exceeds budget
    const remainingBudget = matchingBudget.amount - (matchingBudget.spentAmount || 0);
    if (amountNum > remainingBudget) {
      Alert.alert(
        'Budget Exceeded', 
        `You have exceeded your budget for ${expenseCategory}. Remaining budget: ₱${remainingBudget.toFixed(2)}`
      );
      return;
    }

    try {
      if (isEditing) {
        // Update the existing expense
        const oldExpense = expenses.find(e => e.id === editingExpenseId);
        
        await updateExpense(editingExpenseId, {
          name: expenseName,
          amount: amountNum,
          category: expenseCategory,
        });

        // Adjust budget spent amount
        if (oldExpense.category !== expenseCategory) {
          // If category changed, update both old and new budget categories
          await adjustBudgetSpentAmount(oldExpense.category, -oldExpense.amount);
          await adjustBudgetSpentAmount(expenseCategory, amountNum);
        } else {
          // If same category, just update the difference
          await adjustBudgetSpentAmount(expenseCategory, amountNum - oldExpense.amount);
        }

        setIsEditing(false);
        setEditingExpenseId(null);
      } else {
        // Add a new expense
        const newExpense = {
          name: expenseName,
          amount: amountNum,
          category: expenseCategory,
          date: currentDate.toISOString(),
        };
        await saveExpense(newExpense);

        // Update budget spent amount
        await adjustBudgetSpentAmount(expenseCategory, amountNum);
      }

      // Reset input fields
      setExpenseName('');
      setExpenseAmount('');
      setExpenseCategory('');
      
      // Reload data
      loadInitialData();
    } catch (error) {
      console.error('Error adding/updating expense:', error);
      Alert.alert('Error', 'Failed to save expense');
    }
  };

  // New function to cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditingExpenseId(null);
    setExpenseName('');
    setExpenseAmount('');
    setExpenseCategory('');
  };

  // Helper function to adjust budget spent amount
  const adjustBudgetSpentAmount = async (category, amount) => {
    try {
      const budgetToUpdate = budgets.find(b => b.category === category);
      if (budgetToUpdate) {
        const currentSpentAmount = budgetToUpdate.spentAmount || 0;
        const newSpentAmount = currentSpentAmount + amount;
        
        await updateBudget(budgetToUpdate.id, {
          ...budgetToUpdate,
          spentAmount: Math.max(newSpentAmount, 0)
        });
      }
    } catch (error) {
      console.error('Error adjusting budget spent amount:', error);
    }
  };

  const handleDeleteExpense = async (expense) => {
    try {
      // First, adjust the budget spent amount
      await adjustBudgetSpentAmount(expense.category, -expense.amount);

      // Then delete the expense
      await deleteExpense(expense.id);
      
      // Reload data
      loadInitialData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseDetails}>
        <Text style={[styles.expenseName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.expenseAmount, { color: colors.button }]}>₱{item.amount.toFixed(2)}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.infoButton, { backgroundColor: colors.info }]}
          onPress={() => handleShowExpenseInfo(item)}
        >
          <Text style={styles.actionButtonText}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.edit }]}
          onPress={() => {
            setExpenseName(item.name);
            setExpenseAmount(item.amount.toString());
            setExpenseCategory(item.category);
            setIsEditing(true);
            setEditingExpenseId(item.id);
          }}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.deleteButton, { backgroundColor: colors.delete }]}
          onPress={() => {
            setExpenseToDelete(item);
            setIsDeleteModalVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.button }]}>
        Expense Tracker
      </Text>

      <View style={styles.inputContainer}>
       {/* Edit Mode Cancel Button */}
       {isEditing && (
          <TouchableOpacity 
            style={[styles.cancelEditButton, { backgroundColor: colors.delete }]}
            onPress={cancelEditing}
          >
            <Text style={styles.actionButtonText}>Cancel Edit</Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={[styles.input, { 
            borderColor: colors.input, 
            color: colors.text 
          }]}
          placeholder="Expense Name"
          placeholderTextColor={colors.input}
          value={expenseName}
          onChangeText={setExpenseName}
        />
        <TextInput
          style={[styles.input, { 
            borderColor: colors.input, 
            color: colors.text 
          }]}
          placeholder="Amount"
          placeholderTextColor={colors.input}
          keyboardType="numeric"
          value={expenseAmount}
          onChangeText={setExpenseAmount}
        />
        
        {/* Category Dropdown Modal */}
        <TouchableOpacity 
          style={[styles.input, { 
            borderColor: colors.input, 
            padding: 12,
            justifyContent: 'center'
          }]}
          onPress={() => setIsCategoryModalVisible(true)}
        >
          <Text style={{ 
            color: expenseCategory ? colors.text : colors.input,
            fontSize: 16 
          }}>
            {expenseCategory || 'Select Category'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.button }]}
          onPress={handleAddExpense}
        >
          <Text style={styles.buttonText}>
            {isEditing ? 'Update Expense' : 'Add Expense'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpenseItem}
        ListEmptyComponent={
          <Text style={styles.emptyList}>No expenses added yet</Text>
        }
      />
      
      {/* Category Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCategoryModalVisible}
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.categoryModalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView>
              {budgetCategories.length > 0 ? (
                budgetCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.categoryItem}
                    onPress={() => {
                      setExpenseCategory(category);
                      setIsCategoryModalVisible(false);
                    }}
                  >
                    <Text style={styles.categoryItemText}>{category}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyList}>No categories found. Create a budget first.</Text>
              )}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalCloseButton, { backgroundColor: colors.delete }]}
              onPress={() => setIsCategoryModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this expense?</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={[styles.deleteModalButton, { backgroundColor: colors.delete }]}
                onPress={() => {
                  handleDeleteExpense(expenseToDelete);
                  setIsDeleteModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteModalButton, { backgroundColor: colors.button }]}
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  setExpenseToDelete(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isInfoModalVisible}
        onRequestClose={() => setIsInfoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Expense Details</Text>
            {selectedExpense && (
              <>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Name: </Text>
                  {selectedExpense.name}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Amount: </Text>
                  ₱{selectedExpense.amount.toFixed(2)}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Category: </Text>
                  {selectedExpense.category}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Date: </Text>
                  {formatDate(selectedExpense.date)}
                </Text>
              </>
            )}
            <TouchableOpacity 
              style={[styles.modalCloseButton, { backgroundColor: colors.delete }]}
              onPress={() => setIsInfoModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 30
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
    marginTop: 30
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  expenseDetails: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  expenseName: {
    fontSize: 16,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 10,
    borderRadius: 6,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyList: {
    textAlign: 'center',
    color: '#94A1B2',
    marginTop: 20,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#94A1B2',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  infoButton: {
    padding: 10,
    borderRadius: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalText: {
    width: '100%',
    marginBottom: 10,
    fontSize: 16,
  },
  modalLabel: {
    fontWeight: 'bold',
    color: '#7F5AF0',
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  cancelEditButton: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  categoryModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#94A1B2',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  deleteModalButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default ExpenseScreen;