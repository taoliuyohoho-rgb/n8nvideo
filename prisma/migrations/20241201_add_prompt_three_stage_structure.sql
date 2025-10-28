-- 添加三段式Prompt结构字段
ALTER TABLE prompt_templates 
ADD COLUMN input_requirements TEXT,
ADD COLUMN output_requirements TEXT,
ADD COLUMN output_rules TEXT;
