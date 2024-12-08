import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  Dimensions 
} from 'react-native';
import { 
  getBudgets, 
  getExpenses,
  calculateTotalBudget,
  calculateTotalExpenses
} from '../utils/storage';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  // Colors
  const colors = {
    background: '#16161A',
    text: '#7F5AF0',
    button: '#2CB67D',
    accent: '#7F5AF0',
    cardBackground: '#FFFFFE',
    warning: '#FF6B6B'
  };

  const [dashboardData, setDashboardData] = useState({
    totalBudget: 0,
    budgetsByCategory: [],
    totalExpenses: 0,
    remainingBudget: 0,
    expenseCategories: {},
    budgetUtilization: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all budgets and expenses
        const budgets = await getBudgets();
        const expenses = await getExpenses();
        const totalBudget = await calculateTotalBudget();

        // Categorize expenses
        const expenseCategories = expenses.reduce((categories, expense) => {
          const category = expense.category || 'Uncategorized';
          categories[category] = (categories[category] || 0) + parseFloat(expense.amount);
          return categories;
        }, {});

        // Process budgets with their spent amounts
        const budgetsByCategory = budgets.map(budget => ({
          ...budget,
          remainingAmount: budget.amount - (budget.spentAmount || 0),
          utilizationPercentage: ((budget.spentAmount || 0) / budget.amount) * 100
        }));

        // Calculate total expenses and budget utilization
        const totalExpenses = await calculateTotalExpenses();
        const budgetUtilization = totalBudget > 0 
          ? (totalExpenses / totalBudget) * 100 
          : 0;

        setDashboardData({
          totalBudget,
          budgetsByCategory,
          totalExpenses,
          remainingBudget: totalBudget - totalExpenses,
          expenseCategories,
          budgetUtilization
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', fetchDashboardData);
    return unsubscribe;
  }, [navigation]);

  const renderExpenseCategories = () => {
    return Object.entries(dashboardData.expenseCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount], index) => (
        <View key={index} style={styles.categoryItem}>
          <Text style={styles.categoryName}>{category}</Text>
          <Text style={styles.categoryAmount}>₱{amount.toFixed(2)}</Text>
        </View>
      ));
  };

  const getBudgetsUtilizationColor = (utilizationPercentage) => {
    if (utilizationPercentage <= 50) return colors.button;
    if (utilizationPercentage <= 75) return 'orange';
    return colors.warning;
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContainer}
    >
      <Text style={styles.title}>
        <Text style={{color: colors.text}}>Wallet</Text>
        <Text style={{color: colors.button}}>Mate</Text>
      </Text>
      

      {/* Budget Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>
              ₱{dashboardData.totalBudget.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[
              styles.summaryValue, 
              { 
                color: dashboardData.remainingBudget > 0 
                  ? colors.button 
                  : colors.warning 
              }
            ]}>
              ₱{dashboardData.remainingBudget.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Budget Utilization Progress */}
        <View style={styles.utilizationContainer}>
          <Text style={styles.utilizationLabel}>
            Overall Budget Utilization
          </Text>
          <View style={styles.utilizationBar}>
            <View 
              style={[
                styles.utilizationProgress, 
                { 
                  width: `${Math.min(dashboardData.budgetUtilization, 100)}%`,
                  backgroundColor: getBudgetsUtilizationColor(dashboardData.budgetUtilization)
                }
              ]} 
            />
          </View>
          <Text style={styles.utilizationPercentage}>
            {dashboardData.budgetUtilization.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Expense Categories */}
      <View style={styles.categoriesCard}>
        <Text style={styles.categoriesTitle}>Top Expense Categories</Text>
        {renderExpenseCategories()}
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.text }]}
          onPress={() => navigation.navigate('Budget')}
        >
          <Text style={styles.actionButtonText}>Add Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.button }]}
          onPress={() => navigation.navigate('Expenses')}
        >
          <Text style={styles.actionButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    marginTop: 30
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryColumn: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#94A1B2',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  utilizationContainer: {
    marginTop: 10,
  },
  utilizationLabel: {
    color: '#94A1B2',
    marginBottom: 10,
    textAlign: 'center',
  },
  utilizationBar: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  utilizationProgress: {
    height: '100%',
    borderRadius: 5,
  },
  utilizationPercentage: {
    textAlign: 'center',
    marginTop: 5,
    color: '#94A1B2',
  },
  categoriesCard: {
    backgroundColor: '#F4F4F4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#16161A',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryName: {
    color: '#16161A',
  },
  categoryAmount: {
    color: '#7F5AF0',
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DashboardScreen;