import { useState, useEffect, useCallback } from 'react';
import type { PromptRule, PromptRuleFormData, BusinessModule, PromptRulesState } from '@/types/prompt-rule';

export function usePromptRules() {
  const [state, setState] = useState<PromptRulesState>({
    rules: {},
    currentModule: 'product-analysis',
    loading: false,
    editing: false
  });

  // 获取所有规则
  const fetchRules = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/admin/prompt-rules');
      const result = await response.json();
      
      if (result.success) {
        const rulesMap: Record<string, PromptRule> = {};
        result.data.forEach((rule: PromptRule) => {
          rulesMap[rule.businessModule] = rule;
        });
        
        setState(prev => ({
          ...prev,
          rules: rulesMap,
          loading: false
        }));
      } else {
        console.error('获取规则失败:', result.error);
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('获取规则失败:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // 获取指定业务模块的规则
  const fetchRuleByModule = useCallback(async (businessModule: BusinessModule) => {
    try {
      const response = await fetch(`/api/admin/prompt-rules?businessModule=${businessModule}`);
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          rules: {
            ...prev.rules,
            [businessModule]: result.data
          }
        }));
        return result.data;
      } else {
        console.error('获取业务模块规则失败:', result.error);
        return null;
      }
    } catch (error) {
      console.error('获取业务模块规则失败:', error);
      return null;
    }
  }, []);

  // 创建规则
  const createRule = useCallback(async (ruleData: PromptRuleFormData) => {
    try {
      const response = await fetch('/api/admin/prompt-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          rules: {
            ...prev.rules,
            [ruleData.businessModule]: result.data
          }
        }));
        return result.data;
      } else {
        throw new Error(result.error || '创建规则失败');
      }
    } catch (error) {
      console.error('创建规则失败:', error);
      throw error;
    }
  }, []);

  // 更新规则
  const updateRule = useCallback(async (id: string, ruleData: PromptRuleFormData) => {
    try {
      const response = await fetch('/api/admin/prompt-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...ruleData })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          rules: {
            ...prev.rules,
            [ruleData.businessModule]: result.data
          }
        }));
        return result.data;
      } else {
        throw new Error(result.error || '更新规则失败');
      }
    } catch (error) {
      console.error('更新规则失败:', error);
      throw error;
    }
  }, []);

  // 删除规则
  const deleteRule = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/prompt-rules?id=${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 从状态中移除规则
        setState(prev => {
          const newRules = { ...prev.rules };
          Object.keys(newRules).forEach(module => {
            if (newRules[module].id === id) {
              delete newRules[module];
            }
          });
          return { ...prev, rules: newRules };
        });
        return true;
      } else {
        throw new Error(result.error || '删除规则失败');
      }
    } catch (error) {
      console.error('删除规则失败:', error);
      throw error;
    }
  }, []);

  // 初始化默认规则
  const initDefaultRules = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/prompt-rules/init-defaults', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重新获取所有规则
        await fetchRules();
        return result.data;
      } else {
        throw new Error(result.error || '初始化默认规则失败');
      }
    } catch (error) {
      console.error('初始化默认规则失败:', error);
      throw error;
    }
  }, [fetchRules]);

  // 切换业务模块
  const switchModule = useCallback((businessModule: BusinessModule) => {
    setState(prev => ({ ...prev, currentModule: businessModule }));
  }, []);

  // 设置编辑状态
  const setEditing = useCallback((editing: boolean) => {
    setState(prev => ({ ...prev, editing }));
  }, []);

  // 获取当前模块的规则
  const getCurrentRule = useCallback(() => {
    return state.rules[state.currentModule] || null;
  }, [state.rules, state.currentModule]);

  // 组件挂载时获取规则
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    ...state,
    fetchRules,
    fetchRuleByModule,
    createRule,
    updateRule,
    deleteRule,
    initDefaultRules,
    switchModule,
    setEditing,
    getCurrentRule
  };
}
