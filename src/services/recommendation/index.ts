import { registerScorer } from './registry';
import { productToPersonaScorer } from './scorers/productToPersona';
import { productToScriptScorer } from './scorers/productToScript';
import { productToContentElementsScorer } from './scorers/productToContentElements';
import { taskToModelScorer } from './scorers/taskToModel';
import { TaskToPromptScorer } from './adapters/taskToPromptAdapter';
import { scriptGenerationScorer } from './scorers/scriptGeneration';

registerScorer('product->persona', productToPersonaScorer);
registerScorer('product->script', productToScriptScorer);
registerScorer('product->content-elements', productToContentElementsScorer);
registerScorer('task->model', taskToModelScorer);
registerScorer('task->prompt', new TaskToPromptScorer());
registerScorer('video-script', scriptGenerationScorer);

export * from './types';
export * from './recommend';
