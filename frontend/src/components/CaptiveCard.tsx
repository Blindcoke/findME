// CaptiveCard.tsx
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';

interface CaptiveCardProps {
  captive: any;
  linkTo?: string;
}

export const CaptiveCard = ({ captive }: CaptiveCardProps) => {

  return (
    <div className="hover:scale-[1.02] transition-transform duration-300 relative">
      <Link to={`/captives/${captive.id}`}>
        <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 hover:from-emerald-800/60 hover:to-emerald-700/60 border-2 border-emerald-700/30 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-md h-full">
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-hidden">
            <div className="flex items-start justify-between min-w-0">
              <div className="min-w-0 flex-1 pr-4">
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-100 truncate">
                  {captive.name || "Невідома особа"}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-400 truncate">
                  Додав:{" "}
                  <span className="font-semibold text-emerald-300">
                    {captive.user?.username || 'Unknown User'}
                  </span>
                </p>
              </div>
              {captive.picture && (
                <img
                  src={captive.picture}
                  alt={captive.name || "Фото"}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full border-2 border-emerald-600/50 shadow-lg flex-shrink-0"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
                {captive.status === 'informed' ? (
                    <span className="px-3 py-1 bg-gradient-to-r from-pink-500/80 to-purple-600/80 rounded-full text-sm font-medium text-white truncate">
                        Є інформація
                    </span>
                ) : captive.status === 'searching' ? (
                    <span className="px-3 py-1 bg-gradient-to-r from-green-500/80 to-emerald-600/80 rounded-full text-sm font-medium text-white shadow-md truncate">
                        Розшукується
                    </span>
                ) : captive.status === 'deceased' ? (
                    <span className="px-3 py-1 bg-gradient-to-r from-gray-700/80 to-red-900/80 rounded-full text-sm font-medium text-white shadow-md truncate">
                        Загинув(-ла)
                    </span>
                ) : captive.status === 'reunited' ? (
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500/80 to-cyan-600/80 rounded-full text-sm font-medium text-white shadow-md truncate">
                        Зустрів(-ла) рідних
                    </span>
                ) : null}

                <span className="px-3 py-1 bg-emerald-700/50 rounded-full text-sm text-emerald-100 truncate">
                    {captive.person_type === 'military' ? 'Військовий' : 'Цивільний'}
                </span>
            </div>

            <div className="space-y-2 sm:space-y-3 text-emerald-100 text-sm sm:text-base break-words">
              {captive.person_type === 'military' && captive.brigade && (
                <p className="flex items-center gap-2 truncate">
                  <span className="text-emerald-400 flex-shrink-0">Бригада:</span>
                  <span className="font-medium truncate">{captive.brigade}</span>
                </p>
              )}

              {(captive.region || captive.settlement) && (
                <p className="flex items-center gap-2">
                  <span className="text-emerald-400 flex-shrink-0">Місце:</span>
                  <span className="font-medium line-clamp-2">
                    {[captive.region, captive.settlement].filter(Boolean).join(", ")}
                  </span>
                </p>
              )}

              {captive.date_of_birth && (
                <p className="flex items-center gap-2">
                  <span className="text-emerald-400 flex-shrink-0">Дата нар.:</span>
                  <span className="font-medium">
                    {new Date(captive.date_of_birth).toLocaleDateString()}
                  </span>
                </p>
              )}

              {captive.last_update && (
                <p className="text-xs text-emerald-400/80 mt-2 sm:mt-4">
                  Оновлено: {new Date(captive.last_update).toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default CaptiveCard;