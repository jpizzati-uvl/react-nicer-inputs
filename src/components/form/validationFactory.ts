import {
  Validation,
  ValidationElement,
  InputValue,
  DateRange,
  ValidationResponse,
  ValidationSummaryElement,
  FormModel,
} from '../../types';

export type AnyInputType = InputValue | Date | DateRange;

export interface AssertionsProps {
  [key: string]: (value: AnyInputType, limit?: string | number) => boolean;
}

const emailRegex =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

export const Assertions: AssertionsProps = {
  required: (value: AnyInputType): boolean => {
    const valueStr = value as string;
    const valueDateRange = value as DateRange;
    const startDateStr = valueDateRange.startDate as string;
    const endDateStr = valueDateRange.endDate as string;

    return (
      (typeof valueStr === 'string' && valueStr !== '') ||
      (typeof valueDateRange === 'object' &&
        startDateStr !== undefined &&
        startDateStr !== '' &&
        typeof valueDateRange === 'object' &&
        endDateStr !== undefined &&
        endDateStr !== '')
    );
  },
  email: (value: AnyInputType): boolean => {
    const valueStr = value as string;

    return emailRegex.test(valueStr);
  },
  max: (value: AnyInputType, limit = 0): boolean => {
    if (typeof value === 'string') {
      return value !== '' ? value.length <= limit : true;
    } else if (typeof value !== 'undefined') {
      return value <= limit;
    } else {
      return false;
    }
  },
  min: (value: AnyInputType, limit = 0): boolean => {
    if (typeof value === 'string') {
      return value !== '' ? value.length >= limit : true;
    } else if (typeof value !== 'undefined') {
      return value >= limit;
    } else {
      return false;
    }
  },
  equals: (value: AnyInputType, limit = ''): boolean => {
    return value === limit;
  },
  number: (value: AnyInputType): boolean => {
    const valueStr = value as string;
    return (
      typeof parseInt(valueStr, 10) === 'number' ||
      typeof parseFloat(valueStr) === 'number'
    );
  },
  pattern: (value: AnyInputType, limit): boolean => {
    const valueStr = value as string;
    const regex = limit as string;
    const newRegex = new RegExp(regex);
    let resp = false;

    if (value !== '') {
      resp = newRegex.test(valueStr);
    }

    return resp;
  },
  alpha: (value: AnyInputType): boolean => {
    const valueStr = value as string;

    return /^[A-Za-z]+$/i.test(valueStr);
  },
  alphaNumeric: (value: AnyInputType): boolean => {
    const valueStr = value as string;

    return /^[0-9A-Z]+$/i.test(valueStr);
  },
  name: (value: AnyInputType): boolean => {
    const valueStr = value as string;

    return /^[a-z\u00C0-\u02AB'´`]+\.?\s?([a-z\u00C0-\u02AB'´`]+\.?\s?)+$/i.test(
      valueStr
    );
  },
};

export const runStringRule = (rule: string, value: AnyInputType): boolean => {
  const daRule = Assertions[rule];

  return daRule(value);
};

export const runObjectRule = (
  rule: string,
  boundary: number,
  value: AnyInputType
): boolean => {
  const daRule = Assertions[rule];

  return daRule(value, boundary);
};

export const ValidationFactory = {
  validateInput: (
    value: AnyInputType,
    validate: Validation[] = []
  ): ValidationResponse => {
    const summary: ValidationSummaryElement = {};
    let valid = false;

    if (validate.length > 0) {
      validate.map(validation => {
        const ruleType = typeof validation;

        switch (ruleType) {
          case 'string':
            const ruleStr = validation as string;
            const strResp = runStringRule(ruleStr, value);

            summary[ruleStr] = strResp;
            break;
          case 'object':
            const ruleObjName = Object.keys(validation)[0] as string;
            const validat = validation as ValidationElement;
            const ruleObjValNumber = validat[ruleObjName] as number;
            const ruleObjValFn = validat[ruleObjName] as Function;

            if (
              typeof ruleObjValNumber === 'number' &&
              typeof ruleObjValFn === 'number'
            ) {
              const objNumResp = runObjectRule(
                ruleObjName,
                ruleObjValNumber,
                value
              );

              summary[ruleObjName] = objNumResp;
            }

            if (
              typeof ruleObjValNumber === 'function' &&
              typeof ruleObjValFn === 'function'
            ) {
              const objFnResp = ruleObjValFn(value);

              summary[ruleObjName] = objFnResp;
            }

            break;
          default:
            break;
        }
      });

      for (const el in summary) {
        if (Object.prototype.hasOwnProperty.call(summary, el)) {
          const value = summary[el];

          valid = value;
          if (!value) {
            break;
          }
        }
      }
    } else {
      valid = true;
    }

    return { valid, summary };
  },
  validateForm: (model: FormModel, name: string): boolean => {
    const { fields } = model[name];

    for (const field in fields) {
      if (Object.prototype.hasOwnProperty.call(fields, field)) {
        const fieldElem = fields[field];

        if (fieldElem.valid !== null && !fieldElem.valid) {
          return false;
        }
      }
    }

    return true;
  },
};

export default ValidationFactory;
export const validateInput = ValidationFactory.validateInput;
export const validateForm = ValidationFactory.validateForm;