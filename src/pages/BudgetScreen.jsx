import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  FlatList,
  Modal,
  ScrollView
} from 'react-native';
import { 
  saveBudget, 
  getBudgets, 
  updateBudget, 
  deleteBudget,
} from '../utils/storage';

const BudgetScreen = () => {
  // Predefined budget categories
  const budgetCategories = [
    'Housing',            // Rent, mortgage, property taxes, or home maintenance
    'Food & Dining',      // Groceries, dining out, coffee, and snacks
    'Transportation',     // Gas, car payments, public transit, rideshares, parking
    'Utilities',          // Electricity, water, internet, phone, trash collection
    'Healthcare',         // Doctor visits, medications, insurance premiums
    'Entertainment',      // Movies, concerts, hobbies, subscriptions like Netflix
    'Personal',           // Self-care items, toiletries, clothing, personal projects
    'Savings',            // Emergency fund, retirement accounts, general savings
    'Education',          // Tuition, books, online courses, school supplies
    'Shopping',           // Non-essential purchases, gifts, or seasonal shopping
    'Miscellaneous',      // Unplanned expenses or items not covered in other categories
    'Debt Payments',      // Payments for credit cards, loans, or other debts
    'Gifts & Donations',  // Gifts for others, charitable donations
    'Childcare',          // Daycare, babysitting, school-related expenses
    'Pets',               // Pet food, grooming, veterinary bills, pet insurance
    'Travel',             // Vacations, flights, hotels, transportation for trips
    'Insurance',          // Car, health, home, or life insurance premiums
    'Subscriptions',      // Monthly services like streaming, magazines, gym memberships
    'Taxes',              // Income tax, property tax, or other government fees
    'Fitness & Wellness', // Gym memberships, yoga, therapy, wellness activities
    'Investments',        // Stocks, mutual funds, real estate investments
    'Business Expenses'   // Costs for business operations, tools, or freelance work
];


  // Colors
  const colors = {
    background: '#16161A',
    text: '#2CB67D',
    input: '#7F5AF0',
    button: '#7F5AF0',
    accent: '#7F5AF0',
    delete: '#FF6B6B',
    edit: '#FFA500',
  };

  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  
  // Modal states
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    const savedBudgets = await getBudgets();
    setBudgets(savedBudgets);
  };

  const handleAddBudget = async () => {
    if (!budgetAmount || !budgetCategory) {
      Alert.alert('Invalid Input', 'Please enter budget amount and select a category');
      return;
    }

    const currentDate = new Date();

    if (isEditing) {
      // Update existing budget
      await updateBudget(editingBudgetId, {
        amount: parseFloat(budgetAmount),
        category: budgetCategory,
      });
      setIsEditing(false);
      setEditingBudgetId(null);
    } else {
      // Add new budget
      const newBudget = {
        amount: parseFloat(budgetAmount),
        category: budgetCategory,
        date: currentDate.toISOString(),
      };
      await saveBudget(newBudget);
    }

    // Reset input fields
    setBudgetAmount('');
    setBudgetCategory('');
    
    loadBudgets();
  };

  const handleEditBudget = (budget) => {
    setBudgetAmount(budget.amount.toString());
    setBudgetCategory(budget.category);
    setIsEditing(true);
    setEditingBudgetId(budget.id);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingBudgetId(null);
    setBudgetAmount('');
    setBudgetCategory('');
  };

  const handleDeleteBudget = async (id) => {
    setBudgetToDelete(id);
    setIsDeleteModalVisible(true);
  };

  const confirmDeleteBudget = async () => {
    if (budgetToDelete) {
      await deleteBudget(budgetToDelete);
      loadBudgets();
      setIsDeleteModalVisible(false);
      setBudgetToDelete(null);
    }
  };

  const renderBudgetItem = ({ item }) => (
    <View style={styles.budgetItem}>
      <View style={styles.budgetDetails}>
        <Text style={[styles.budgetCategory, { color: colors.text }]}>
          {item.category}
        </Text>
        <Text style={[styles.budgetAmount, { color: colors.accent }]}>
          ₱{item.amount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.edit }]}
          onPress={() => handleEditBudget(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.deleteButton, { backgroundColor: colors.delete }]}
          onPress={() => handleDeleteBudget(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.button }]}>
        Budget Planner
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
            color: budgetCategory ? colors.text : colors.input,
            fontSize: 16 
          }}>
            {budgetCategory || 'Select Category'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { 
            borderColor: colors.input, 
            color: colors.text 
          }]}
          placeholder="Budget Amount"
          placeholderTextColor={colors.input}
          keyboardType="numeric"
          value={budgetAmount}
          onChangeText={setBudgetAmount}
        />

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.button }]}
          onPress={handleAddBudget}
        >
          <Text style={styles.buttonText}>
            {isEditing ? 'Update Budget' : 'Add Budget'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBudgetItem}
        ListEmptyComponent={
          <Text style={styles.emptyList}>No budgets added yet</Text>
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
              {budgetCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryItem}
                  onPress={() => {
                    setBudgetCategory(category);
                    setIsCategoryModalVisible(false);
                  }}
                >
                  <Text style={styles.categoryItemText}>{category}</Text>
                </TouchableOpacity>
              ))}
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
            <Text style={styles.modalText}>Are you sure you want to delete this budget?</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={[styles.deleteModalButton, { backgroundColor: colors.delete }]}
                onPress={confirmDeleteBudget}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteModalButton, { backgroundColor: colors.button }]}
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  setBudgetToDelete(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  budgetDetails: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetCategory: {
    fontSize: 16,
    marginBottom: 5,
  },
  budgetAmount: {
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
  modalCloseButton: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
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

export default BudgetScreen;