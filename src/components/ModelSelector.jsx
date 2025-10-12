import { getAllModels } from '../services/aiServiceSimple';

const ModelSelector = ({ selectedModel, onModelChange, disabled = false }) => {
  const models = getAllModels();

  // Get Xanny Pro usage for today
  const getXannyProUsage = () => {
    const today = new Date().toDateString();
    const usage = localStorage.getItem(`xanny_pro_usage_${today}`);
    return usage ? parseInt(usage) : 0;
  };

  const xannyProUsage = getXannyProUsage();
  const isXannyProLimited = xannyProUsage >= 20;

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

  const getModelDisplayName = (model) => {
    if (model.id === 'llama-3.3-70b-versatile') {
      return (
        <span className="flex items-center gap-2">
          <span className="text-yellow-400">👑</span>
          <span>{model.name}</span>
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">PRO</span>
        </span>
      );
    }
    return model.name;
  };

  return (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="appearance-none bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-10 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] sm:min-w-[200px] hover:bg-black/30 shadow-xl"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.05) 100%)',
        }}
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
                className={model.id === 'llama-3.3-70b-versatile' ? 'bg-gradient-to-r from-yellow-900/80 to-orange-900/80 text-white hover:from-yellow-800/90 hover:to-orange-800/90' : 'bg-black/80 text-white hover:bg-blue-600/20'}
                style={
                  model.id === 'llama-3.3-70b-versatile'
                    ? {
                        background: 'linear-gradient(135deg, rgba(180,83,9,0.8) 0%, rgba(217,119,6,0.8) 50%, rgba(0,0,0,0.9) 100%)',
                      }
                    : {
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.9) 100%)',
                      }
                }
              >
                {model.id === 'llama-3.3-70b-versatile' ? `👑 Xanny Pro ${isXannyProLimited ? '(Limited)' : `(${20 - xannyProUsage} left)`}` : model.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4 text-white/70"
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
