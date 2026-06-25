import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthNav({ month, onPrev, onNext, onToday, todayLabel = 'Hoje', children }) {
  return (
    <div className="month-nav">
      <div className="month-nav-controls">
        <button type="button" onClick={onPrev} className="month-nav-btn" aria-label="Mês anterior">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="month-nav-label">{format(month, 'MMMM yyyy', { locale: ptBR })}</span>
        <button type="button" onClick={onNext} className="month-nav-btn" aria-label="Próximo mês">
          <ChevronRight className="w-4 h-4" />
        </button>
        {onToday && (
          <button type="button" onClick={onToday} className="month-nav-today">
            {todayLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
