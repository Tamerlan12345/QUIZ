
import React, { useState, useCallback, useMemo } from 'react';
import { AgreementType, InfoSubType, MonetaryOperation, InsuredPerson } from './types';
import type { FormState } from './types';
import { sanitizeNumberInput, formatNumberWithSpaces, formatDateRu, numberToWordsRu } from './formatting';

// --- Reusable Helper Components (defined outside App to prevent re-renders) ---

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative flex items-center ml-2">
    <div className="w-5 h-5 rounded-full border border-cyan-400 text-cyan-400 flex items-center justify-center text-sm font-bold cursor-help select-none">?</div>
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 border border-cyan-500/50 text-gray-200 text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
      {text}
    </div>
  </div>
);

interface FieldsetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}
const Fieldset: React.FC<FieldsetProps> = ({ title, children, className = '' }) => (
  <fieldset className={`border border-dashed border-gray-600 p-4 rounded-lg relative mt-6 ${className}`}>
    <legend className="text-cyan-400 font-orbitron px-2 text-lg tracking-wider">{title}</legend>
    <div className="space-y-5">{children}</div>
  </fieldset>
);

interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  tooltip?: string;
}
const InputGroup: React.FC<InputGroupProps> = ({ label, children, tooltip }) => (
  <div className="flex flex-col">
    <label className="text-gray-400 mb-1 flex items-center">
      {label}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
    {children}
  </div>
);

const baseInputClasses = "w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-lime-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition duration-200";

// --- Main Application Component ---

export default function App() {
  const [state, setState] = useState<FormState>({
    contractNumber: '',
    contractDate: '',
    insuranceType: '',
    agreementType: AgreementType.Monetary,
    basisDocument: '',
    basisDocumentNumber: '',
    basisDocumentDate: '',
    sumOperation: MonetaryOperation.Increase,
    currentSum: '',
    deltaSum: '',
    isSumUnchanged: false,
    premiumOperation: MonetaryOperation.Increase,
    currentPremium: '',
    deltaPremium: '',
    isPremiumUnchanged: false,
    paymentDeadline: '',
    infoSubType: InfoSubType.General,
    generalInfoText: '',
    insuredToAdd: [],
    insuredToRemove: [],
  });

  const [generatedText, setGeneratedText] = useState('');

  const handleStateChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState(prevState => ({ ...prevState, [key]: value }));
  };
  
  const handleNumericChange = (key: keyof FormState, value: string) => {
    handleStateChange(key, sanitizeNumberInput(value));
  };

  const addInsuredPerson = (listKey: 'insuredToAdd' | 'insuredToRemove') => {
    const newPerson: InsuredPerson = { id: crypto.randomUUID(), name: '', iin: '' };
    handleStateChange(listKey, [...state[listKey], newPerson]);
  };

  const removeInsuredPerson = (listKey: 'insuredToAdd' | 'insuredToRemove', id: string) => {
    handleStateChange(listKey, state[listKey].filter(p => p.id !== id));
  };
  
  const updateInsuredPerson = (listKey: 'insuredToAdd' | 'insuredToRemove', id: string, field: 'name' | 'iin', value: string) => {
    handleStateChange(listKey, state[listKey].map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  
  const calculatedValues = useMemo(() => {
    const currentSumNum = parseFloat(state.currentSum) || 0;
    const deltaSumNum = parseFloat(state.deltaSum) || 0;
    const newSum = state.sumOperation === MonetaryOperation.Increase ? currentSumNum + deltaSumNum : currentSumNum - deltaSumNum;

    const currentPremiumNum = parseFloat(state.currentPremium) || 0;
    const deltaPremiumNum = parseFloat(state.deltaPremium) || 0;
    const newPremium = state.premiumOperation === MonetaryOperation.Increase ? currentPremiumNum + deltaPremiumNum : currentPremiumNum - deltaPremiumNum;
    
    return { newSum, newPremium };
  }, [state.currentSum, state.deltaSum, state.sumOperation, state.currentPremium, state.deltaPremium, state.premiumOperation]);

  const generateAgreementText = useCallback(() => {
    const { newSum, newPremium } = calculatedValues;
    const parts: string[] = [];
    
    parts.push(`ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ №_____\nк Договору ${state.insuranceType} страхования №${state.contractNumber} от ${formatDateRu(state.contractDate)}`);
    parts.push(`\n[Город]                                                                                                    ${formatDateRu(new Date().toISOString().split('T')[0])}`);
    parts.push(`\n[Наименование Страховщика], именуемое в дальнейшем «Страховщик», в лице [ФИО, должность], действующего на основании [документ], с одной стороны, и [Наименование Страхователя], именуемое в дальнейшем «Страхователь», в лице [ФИО, должность], действующего на основании [документ], с другой стороны, совместно именуемые «Стороны», заключили настоящее Дополнительное соглашение (далее – «Соглашение») о нижеследующем:`);
    
    if (state.agreementType === AgreementType.Monetary && state.basisDocument) {
      parts.push(`\n1. Настоящее Соглашение заключено на основании ${state.basisDocument} № ${state.basisDocumentNumber} от ${formatDateRu(state.basisDocumentDate)}.`);
    }

    let itemCounter = state.agreementType === AgreementType.Monetary && state.basisDocument ? 2 : 1;
    const addClause = (text: string) => {
      parts.push(`\n${itemCounter}. ${text}`);
      itemCounter++;
    };
    
    if (state.agreementType === AgreementType.Monetary) {
        if (!state.isSumUnchanged && state.deltaSum) {
            const deltaSumNum = parseFloat(state.deltaSum);
            const operationText = state.sumOperation === MonetaryOperation.Increase ? 'увеличить' : 'уменьшить';
            addClause(`Внести изменения в пункт Договора, касающийся страховой суммы, и изложить его в следующей редакции: «${operationText} страховую сумму по Договору на ${formatNumberWithSpaces(state.deltaSum)} (${numberToWordsRu(deltaSumNum)}) тенге. Новая страховая сумма по Договору устанавливается в размере ${formatNumberWithSpaces(String(newSum))} (${numberToWordsRu(newSum)}) тенге.».`);
        }
        if (!state.isPremiumUnchanged && state.deltaPremium) {
            const deltaPremiumNum = parseFloat(state.deltaPremium);
            const operationText = state.premiumOperation === MonetaryOperation.Increase ? 'увеличить' : 'уменьшить';
            const paymentText = state.premiumOperation === MonetaryOperation.Increase ? 'доплате' : 'возврату';
            addClause(`Внести изменения в пункт Договора, касающийся страховой премии, и изложить его в следующей редакции: «${operationText} страховую премию по Договору на ${formatNumberWithSpaces(state.deltaPremium)} (${numberToWordsRu(deltaPremiumNum)}) тенге. Новая страховая премия по Договору устанавливается в размере ${formatNumberWithSpaces(String(newPremium))} (${numberToWordsRu(newPremium)}) тенге.».`);
            if (state.paymentDeadline) {
                addClause(`Сумма, подлежащая ${paymentText}, должна быть перечислена Страхователем/Страховщиком в срок до ${formatDateRu(state.paymentDeadline)}.`);
            }
        }
    } else { // Info type
        if(state.infoSubType === InfoSubType.General && state.generalInfoText) {
            addClause(state.generalInfoText);
        } else if (state.infoSubType === InfoSubType.Insured) {
            if (state.insuredToAdd.length > 0) {
                 const list = state.insuredToAdd.map(p => `- ${p.name.trim()}, ИИН ${p.iin.trim()}`).join('\n');
                 addClause(`Включить в список Застрахованных по Договору следующих лиц:\n${list}`);
            }
            if (state.insuredToRemove.length > 0) {
                 const list = state.insuredToRemove.map(p => `- ${p.name.trim()}, ИИН ${p.iin.trim()}`).join('\n');
                 addClause(`Исключить из списка Застрахованных по Договору следующих лиц:\n${list}`);
            }
        }
    }

    addClause("Все остальные условия Договора, не затронутые настоящим Соглашением, остаются неизменными, и Стороны подтверждают по ним свои обязательства.");
    addClause("Настоящее Соглашение вступает в силу с даты подписания настоящего дополнительного соглашения и является неотъемлемой частью Договора.");
    addClause("Настоящее Соглашение составлено в 2 (двух) экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из Сторон.");

    parts.push("\n\nПОДПИСИ СТОРОН:");
    parts.push("\nСтраховщик: _____________________");
    parts.push("\nСтрахователь: ___________________");

    setGeneratedText(parts.join('\n'));
  }, [state, calculatedValues]);

  return (
    <div className="min-h-screen bg-gray-900/50 text-gray-200 p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-cyan-300 tracking-widest uppercase" style={{ textShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee' }}>
          Agreement Generator <span className="text-fuchsia-400">v5.2</span>
        </h1>
        <p className="text-gray-400 mt-2">Интерфейс генерации юридических формулировок</p>
      </header>
      
      <main className="max-w-screen-2xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* --- LEFT COLUMN: INPUTS --- */}
        <div className="bg-black/20 p-6 rounded-xl border border-gray-700/50">
          <Fieldset title="Общие данные">
            <InputGroup label="Номер основного договора">
                <input type="text" value={state.contractNumber} onChange={e => handleStateChange('contractNumber', e.target.value)} className={baseInputClasses} />
            </InputGroup>
            <InputGroup label="Дата основного договора">
                <input type="date" value={state.contractDate} onChange={e => handleStateChange('contractDate', e.target.value)} className={baseInputClasses} />
            </InputGroup>
            <InputGroup label="Вид страхования">
                <input type="text" value={state.insuranceType} onChange={e => handleStateChange('insuranceType', e.target.value)} className={baseInputClasses} placeholder="например, добровольного" />
            </InputGroup>
          </Fieldset>

          <Fieldset title="Тип и основание">
             <InputGroup label="Тип соглашения">
                <div className="flex space-x-4">
                  {(Object.values(AgreementType) as AgreementType[]).map(type => (
                    <button key={type} onClick={() => handleStateChange('agreementType', type)} className={`px-4 py-2 rounded-md transition-all duration-200 w-full ${state.agreementType === type ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(34,211,238,0.7)]' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      {type === AgreementType.Monetary ? 'Денежное' : 'Информационное'}
                    </button>
                  ))}
                </div>
             </InputGroup>
            
            {state.agreementType === AgreementType.Monetary && (
              <div className="space-y-4 border-t border-gray-700 pt-4 mt-4">
                <InputGroup label="Документ-основание" tooltip="Например: Письмо Страхователя, Служебная записка и т.д.">
                  <input type="text" value={state.basisDocument} onChange={e => handleStateChange('basisDocument', e.target.value)} className={baseInputClasses} />
                </InputGroup>
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Номер документа">
                    <input type="text" value={state.basisDocumentNumber} onChange={e => handleStateChange('basisDocumentNumber', e.target.value)} className={baseInputClasses} />
                  </InputGroup>
                  <InputGroup label="Дата документа">
                    <input type="date" value={state.basisDocumentDate} onChange={e => handleStateChange('basisDocumentDate', e.target.value)} className={baseInputClasses} />
                  </InputGroup>
                </div>
              </div>
            )}
          </Fieldset>

          {state.agreementType === AgreementType.Monetary && (
            <Fieldset title="Расчет сумм и премий">
                {/* Insurance Sum */}
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg text-fuchsia-400">Страховая сумма</h3>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={state.isSumUnchanged} onChange={e => handleStateChange('isSumUnchanged', e.target.checked)} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-500 text-cyan-500 rounded focus:ring-cyan-500" />
                            <span className="ml-2 text-sm text-gray-400">Без изменений</span>
                        </label>
                    </div>
                    {!state.isSumUnchanged && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <InputGroup label="Операция">
                            <select value={state.sumOperation} onChange={e => handleStateChange('sumOperation', e.target.value as MonetaryOperation)} className={baseInputClasses}>
                                <option value={MonetaryOperation.Increase}>Увеличить</option>
                                <option value={MonetaryOperation.Decrease}>Уменьшить</option>
                            </select>
                        </InputGroup>
                        <div/>
                        <InputGroup label="Текущая сумма">
                           <input type="text" value={formatNumberWithSpaces(state.currentSum)} onChange={e => handleNumericChange('currentSum', e.target.value)} className={baseInputClasses} placeholder="1 000 000" />
                        </InputGroup>
                        <InputGroup label="Сумма изменения (дельта)">
                            <input type="text" value={formatNumberWithSpaces(state.deltaSum)} onChange={e => handleNumericChange('deltaSum', e.target.value)} className={baseInputClasses} placeholder="500 000" />
                        </InputGroup>
                        <InputGroup label="Новая итоговая сумма">
                            <div className={`${baseInputClasses} text-lime-400 font-bold`}>{formatNumberWithSpaces(String(calculatedValues.newSum))}</div>
                        </InputGroup>
                      </div>
                    )}
                </div>

                {/* Insurance Premium */}
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg text-fuchsia-400">Страховая премия</h3>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={state.isPremiumUnchanged} onChange={e => handleStateChange('isPremiumUnchanged', e.target.checked)} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-500 text-cyan-500 rounded focus:ring-cyan-500" />
                            <span className="ml-2 text-sm text-gray-400">Без изменений</span>
                        </label>
                    </div>
                    {!state.isPremiumUnchanged && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <InputGroup label="Операция">
                            <select value={state.premiumOperation} onChange={e => handleStateChange('premiumOperation', e.target.value as MonetaryOperation)} className={baseInputClasses}>
                                <option value={MonetaryOperation.Increase}>Увеличить</option>
                                <option value={MonetaryOperation.Decrease}>Уменьшить</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="Срок доплаты/возврата">
                           <input type="date" value={state.paymentDeadline} onChange={e => handleStateChange('paymentDeadline', e.target.value)} className={baseInputClasses}/>
                        </InputGroup>
                        <InputGroup label="Текущая премия">
                           <input type="text" value={formatNumberWithSpaces(state.currentPremium)} onChange={e => handleNumericChange('currentPremium', e.target.value)} className={baseInputClasses} placeholder="10 000" />
                        </InputGroup>
                        <InputGroup label="Сумма изменения (дельта)">
                            <input type="text" value={formatNumberWithSpaces(state.deltaPremium)} onChange={e => handleNumericChange('deltaPremium', e.target.value)} className={baseInputClasses} placeholder="5 000" />
                        </InputGroup>
                         <InputGroup label="Новая итоговая премия">
                            <div className={`${baseInputClasses} text-lime-400 font-bold`}>{formatNumberWithSpaces(String(calculatedValues.newPremium))}</div>
                        </InputGroup>
                      </div>
                    )}
                </div>
            </Fieldset>
          )}

          {state.agreementType === AgreementType.Info && (
            <Fieldset title="Информационные правки">
              <InputGroup label="Подтип изменений">
                <div className="flex space-x-4">
                  {(Object.values(InfoSubType) as InfoSubType[]).map(type => (
                    <button key={type} onClick={() => handleStateChange('infoSubType', type)} className={`px-4 py-2 rounded-md transition-all duration-200 w-full ${state.infoSubType === type ? 'bg-fuchsia-500 text-white shadow-[0_0_10px_rgba(217,70,239,0.7)]' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      {type === InfoSubType.General ? 'Общий текст' : 'Застрахованные'}
                    </button>
                  ))}
                </div>
              </InputGroup>
              
              {state.infoSubType === InfoSubType.General && (
                <InputGroup label="Описание изменений" tooltip="Опишите суть изменений. Например: Стороны договорились изменить порядок оплаты страховой премии...">
                    <textarea value={state.generalInfoText} onChange={e => handleStateChange('generalInfoText', e.target.value)} className={`${baseInputClasses} h-32`} />
                </InputGroup>
              )}
              
              {state.infoSubType === InfoSubType.Insured && (
                 <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="text-lg text-lime-300">Включить в список</h4>
                           <button onClick={() => addInsuredPerson('insuredToAdd')} className="bg-lime-600 hover:bg-lime-500 text-white text-sm px-3 py-1 rounded-md transition">+ Добавить</button>
                        </div>
                        <div className="space-y-2">
                            {state.insuredToAdd.map(p => (
                                <div key={p.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                    <input type="text" placeholder="ФИО" value={p.name} onChange={e => updateInsuredPerson('insuredToAdd', p.id, 'name', e.target.value)} className={`${baseInputClasses} text-sm`} />
                                    <input type="text" placeholder="ИИН" value={p.iin} onChange={e => updateInsuredPerson('insuredToAdd', p.id, 'iin', e.target.value)} className={`${baseInputClasses} text-sm`} />
                                    <button onClick={() => removeInsuredPerson('insuredToAdd', p.id)} className="text-red-500 hover:text-red-400 text-2xl font-bold">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="text-lg text-lime-300">Исключить из списка</h4>
                           <button onClick={() => addInsuredPerson('insuredToRemove')} className="bg-red-600 hover:bg-red-500 text-white text-sm px-3 py-1 rounded-md transition">+ Исключить</button>
                        </div>
                        <div className="space-y-2">
                            {state.insuredToRemove.map(p => (
                                <div key={p.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                    <input type="text" placeholder="ФИО" value={p.name} onChange={e => updateInsuredPerson('insuredToRemove', p.id, 'name', e.target.value)} className={`${baseInputClasses} text-sm`} />
                                    <input type="text" placeholder="ИИН" value={p.iin} onChange={e => updateInsuredPerson('insuredToRemove', p.id, 'iin', e.target.value)} className={`${baseInputClasses} text-sm`} />
                                    <button onClick={() => removeInsuredPerson('insuredToRemove', p.id)} className="text-red-500 hover:text-red-400 text-2xl font-bold">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
              )}
            </Fieldset>
          )}
        </div>

        {/* --- RIGHT COLUMN: OUTPUT --- */}
        <div className="bg-black/20 p-6 rounded-xl border border-gray-700/50 flex flex-col">
          <Fieldset title="Заключение" className="flex-grow flex flex-col">
            <textarea
              readOnly
              value={generatedText}
              placeholder="Сгенерированный текст появится здесь..."
              className={`${baseInputClasses} flex-grow h-96 min-h-[400px] lg:min-h-0 whitespace-pre-wrap leading-relaxed`}
            />
          </Fieldset>
          <div className="mt-6">
            <button
              onClick={generateAgreementText}
              className="w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-bold font-orbitron text-xl py-4 rounded-lg tracking-wider uppercase transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.6)]"
            >
              Сгенерировать текст
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}