import { useEffect, useRef, useState } from "react";
import type { Ref } from "react";
import { Input } from "antd";
import type { InputProps, InputRef } from "antd";

type CompositionInputProps = Omit<InputProps,
  "value" | "defaultValue" | "onChange" | "onCompositionStart" | "onCompositionEnd"
> & {
  value: string;
  onValueChange: (value: string) => void;
  ref?: Ref<InputRef>;
};

/** Keep IME preedit text local so routing never interrupts candidate selection. */
export function CompositionInput({ value, onValueChange, ref, ...props }: CompositionInputProps) {
  const [draft, setDraft] = useState(value);
  const composing = useRef(false);
  const lastCommitted = useRef(value);

  useEffect(() => {
    if (!composing.current) {
      setDraft(value);
      lastCommitted.current = value;
    }
  }, [value]);

  const commit = (next: string) => {
    // Some browsers send another change after compositionend.
    if (next !== lastCommitted.current) {
      lastCommitted.current = next;
      onValueChange(next);
    }
  };

  return <Input
    {...props}
    ref={ref}
    value={draft}
    onCompositionStart={() => { composing.current = true; }}
    onCompositionEnd={event => {
      composing.current = false;
      const next = event.currentTarget.value;
      setDraft(next);
      commit(next);
    }}
    onChange={event => {
      const next = event.target.value;
      setDraft(next);
      if (!composing.current && !(event.nativeEvent as InputEvent).isComposing) {
        commit(next);
      }
    }}
  />;
}
