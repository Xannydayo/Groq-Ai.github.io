import { getAllModels } from '../services/aiServiceSimple';

const ModelSelector = ({ selectedModel, onModelChange, disabled = false }) => {
  const models = getAllModels();

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {});

  const getModelIcon = (provider) => {
    switch (provider) {
      case 'Groq':
        return '⚡';
      default:
        return '🔮';
    }
  };

  return (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] hover:bg-white/10"
      >
        {Object.entries(groupedModels).map(([provider, providerModels]) => (
          <optgroup
            key={provider}
            label={`${getModelIcon(provider)} ${provider}`}
          >
            {providerModels.map((model) => (
              <option
                key={model.id}
                value={model.id}
                className="bg-slate-900 text-white"
              >
                {model.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
};

export default ModelSelector;
