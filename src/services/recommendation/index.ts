import { registerScorer } from './registry';
import { productToStyleScorer } from './scorers/productToStyle';
import { taskToModelScorer } from './scorers/taskToModel';
import { TaskToPromptScorer } from './adapters/taskToPromptAdapter';

registerScorer('product->style', productToStyleScorer);
registerScorer('task->model', taskToModelScorer);
registerScorer('task->prompt', new TaskToPromptScorer());

export * from './types';
export * from './recommend';
