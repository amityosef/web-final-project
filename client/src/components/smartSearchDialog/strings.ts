export const dialogTitle = 'AI-Powered Smart Search';
export const searchPlaceholder = 'Ask anything... (e.g., "Show me recent posts about...")';
export const searchButtonText = 'Search';
export const closeButtonText = 'Close';
export const clearButtonText = 'Clear';
export const noResultsTitle = 'No Results Found';
export const noResultsMessage = 'Try rephrasing your query or asking something different.';
export const errorTitle = 'Search Error';
export const loadingMessage = 'Analyzing your question...';
export const viewPostLabel = 'View Post';
export const betaLabel = 'Beta';
export const emptyStateMessage = 'Enter a question or search query to discover relevant posts';
export const foundResults = (count: number): string =>
  `Found ${count} relevant ${count === 1 ? 'result' : 'results'}`;
