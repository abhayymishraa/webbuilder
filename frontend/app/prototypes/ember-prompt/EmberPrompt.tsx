"use client";

import { useRef, useState } from "react";
import { ArrowRight, Asterisk, Plus, X } from "lucide-react";
import styles from "./ember-prompt.module.css";
import { StudyNav } from "../_components/StudyNav";

const examples = [
  { label: "A portfolio", prompt: "a beautiful portfolio for my cow" },
  {
    label: "A personal space",
    prompt: "a quiet reading room for my favourite books",
  },
  {
    label: "Something useful",
    prompt: "a simple habit tracker that celebrates small wins",
  },
];

export function EmberPrompt() {
  const [prompt, setPrompt] = useState("");
  const [brief, setBrief] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  function dismiss() {
    dialog.current?.close();
    input.current?.focus();
  }

  return (
    <main className={styles.page + " prompt-study-page"}>
      <div
        className={styles.atmosphere + " prompt-study-atmosphere"}
        aria-hidden="true"
      />
      <div className={styles.grid + " prompt-study-grid"} aria-hidden="true" />

      <StudyNav active="prompt" />

      <section
        className={
          'prompt-study-hero w-full max-w-290 my-0 mx-auto pt-12 px-8 pb-16 text-center flex-1 [&_h1]:mt-8 [&_h1]:text-[clamp(36px,_4.8vw,_56px)] [&_h1]:leading-[1.13] [&_h1]:font-normal [&_h1]:tracking-[-0.052em] [&_h1_em]:[font-family:"Iowan_Old_Style",_"Palatino_Linotype",_"Book_Antiqua",_Georgia,_serif] [&_h1_em]:font-normal [&_h1_em]:tracking-[-0.065em] [&_h1_em]:text-[#ff946e] max-[601px]:pt-10 max-[601px]:px-5.5 max-[601px]:pb-14 max-[601px]:[&_h1]:text-[clamp(32px,_8vw,_40px)] max-[601px]:[&_h1]:mt-[29px] max-[601px]:[&_h1]:leading-[1.19]'
        }
        aria-labelledby="prompt-heading"
      >
        <div className="prompt-study-wordmark inline-flex items-center gap-[7px] text-[#b9aaa1] text-[19px] font-medium tracking-[-0.7px] [&_svg]:text-[#ff7145] max-[601px]:text-[17px]">
          <Asterisk size={25} strokeWidth={1.6} aria-hidden="true" />
          <span>webbuilder</span>
        </div>
        <h1 id="prompt-heading">
          The right prompt.
          <br />
          Your next <em>big idea.</em>
        </h1>
        <p className="prompt-study-intro mt-6 text-[#b19e94] text-[14px] tracking-[-0.1px] max-[601px]:max-w-[245px] max-[601px]:mt-5.5 max-[601px]:mx-auto max-[601px]:mb-0 max-[601px]:text-[12px] max-[601px]:leading-[1.6]">
          Every great thing begins with a little spark.
        </p>

        <div className="prompt-study-promptArea max-w-190 mt-16 mx-auto mb-0 relative max-[601px]:mt-12">
          <form
            className="prompt-study-prompt relative flex items-center gap-5 pt-0 pr-[21px] pb-0 pl-[27px] h-25.5 border border-[#70503d70] rounded-[100px] [background:linear-gradient(100deg,_#090807_3%,_#100b08_55%,_#0c0a09)] [box-shadow:inset_0_1px_0_#fff1e905,_0_22px_70px_#00000045] [&:focus-within]:border-[#c78564] max-[601px]:gap-2 max-[601px]:h-19 max-[601px]:py-0 max-[601px]:px-[11px]"
            onSubmit={(event) => {
              event.preventDefault();
              if (!prompt.trim()) return;
              setBrief(prompt.trim());
              dialog.current?.showModal();
            }}
          >
            <button
              type="button"
              className="prompt-study-newPrompt relative shrink-0 inline-flex items-center justify-center w-11 h-11 border-0 rounded-full bg-transparent text-[#d5c3b7] [transition:transform_140ms_cubic-bezier(0.23,_1,_0.32,_1)] pointer-fine:[&:hover]:bg-[#ff714512] pointer-fine:[&:hover]:text-[#fff3e9] [@media(prefers-reduced-motion:_no-preference)]:[&:active]:[transform:scale(0.97)] [@media(prefers-reduced-motion:_no-preference)]:[&:focus-visible:active]:transform-none max-[601px]:w-11 max-[601px]:[&_svg]:w-6"
              aria-label="Start a new prompt"
              onClick={() => {
                setPrompt("");
                input.current?.focus();
              }}
            >
              <Plus size={28} strokeWidth={1.2} aria-hidden="true" />
            </button>
            <label
              className="prompt-study-create relative text-[25px] font-normal tracking-[-0.6px] cursor-text max-[601px]:text-[18px]"
              htmlFor="ember-concept-prompt"
            >
              Create
            </label>
            <div
              className={
                styles.inputWrap +
                " prompt-study-inputWrap min-w-0 flex-1 relative [&_input]:relative [&_input]:block [&_input]:w-full [&_input]:h-13.5 [&_input]:pt-0 [&_input]:pr-0 [&_input]:pb-0 [&_input]:pl-3 [&_input]:border-0 [&_input]:rounded-[0] [&_input]:bg-transparent [&_input]:text-[#fff3e9] [&_input]:caret-[#ffd1b8] [&_input]:text-[25px] [&_input]:tracking-[-0.7px] [&_input]:outline-none [&_input]:text-ellipsis [&_input:focus-visible]:outline-none [&_input::placeholder]:text-[#d8b7a5] [&_input::placeholder]:opacity-75 max-[601px]:[&_input]:text-[17px] max-[601px]:[&_input]:tracking-[-0.5px] max-[601px]:[&_input]:pl-2"
              }
            >
              <div
                className={styles.beam + " prompt-study-beam"}
                aria-hidden="true"
              />
              <div
                className={styles.bloom + " prompt-study-bloom"}
                aria-hidden="true"
              />
              <span
                className={styles.caret + " prompt-study-caret"}
                aria-hidden="true"
              />
              <input
                ref={input}
                id="ember-concept-prompt"
                aria-label="Describe what you want to create"
                aria-describedby="ember-concept-note"
                value={prompt}
                placeholder="Something extraordinary"
                maxLength={2000}
                autoComplete="off"
                onChange={(event) => setPrompt(event.target.value)}
                required
              />
            </div>
            <button
              className="prompt-study-submit relative shrink-0 inline-flex items-center justify-center w-11 h-11 border-0 rounded-full [transition:transform_140ms_cubic-bezier(0.23,_1,_0.32,_1)] text-[#100a07] bg-[#ff7145] [&:disabled]:text-[#b89784] [&:disabled]:bg-[#4b2e2180] [&:disabled]:cursor-default pointer-fine:[&:not(:disabled):hover]:bg-[#ff946e] [@media(prefers-reduced-motion:_no-preference)]:[&:not(:disabled):active]:[transform:scale(0.97)] [@media(prefers-reduced-motion:_no-preference)]:[&:focus-visible:active]:transform-none max-[601px]:w-11 max-[601px]:h-11 max-[601px]:[&_svg]:w-[17px]"
              type="submit"
              disabled={!prompt.trim()}
              aria-label="Preview your idea"
            >
              <ArrowRight size={22} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </form>

          <div
            className="prompt-study-suggestions relative flex items-center justify-center flex-wrap gap-y-3 gap-x-5 mt-8 text-[11px] [&>span]:text-[#a38e82] [&_button]:inline-flex [&_button]:items-center [&_button]:gap-[9px] [&_button]:min-h-9 [&_button]:py-[3px] [&_button]:px-0 [&_button]:text-[#c7aea0] [&_button]:bg-transparent [&_button]:border-0 [&_svg]:text-[#c97751] pointer-fine:[&_button:hover]:text-[#fff3e9] max-[601px]:gap-y-[3px] max-[601px]:gap-x-4.5 max-[601px]:mt-6.5 max-[601px]:text-[10px] max-[601px]:[&>span]:w-full max-[601px]:[&>span]:mb-[5px]"
            aria-label="Example prompts"
          >
            <span>A spark to start</span>
            {examples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => {
                  setPrompt(example.prompt);
                  input.current?.focus();
                }}
              >
                {example.label}
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="prompt-study-footer relative py-7 px-10.5 flex justify-between gap-4.5 text-[#a18c80] text-[11px] [&_em]:[font-family:Georgia,_serif] [&_em]:text-[#c4a896] [&>span:last-child]:text-[10px] max-[601px]:p-6 max-[601px]:items-center max-[601px]:flex-col max-[601px]:text-[10px]">
        <span>
          Small beginnings. <em>Endless possibilities.</em>
        </span>
        <span id="ember-concept-note">
          Interactive concept · No generation runs
        </span>
      </footer>

      <dialog
        ref={dialog}
        className={
          styles.dialog +
          " prompt-study-dialog fixed inset-0 m-auto w-[min(510px,_calc(100%_-_32px))] max-h-[calc(100svh_-_40px)] overflow-y-auto p-10.5 text-[#f8f2ed] bg-[#14100e] border border-[#674735] rounded-[20px] [box-shadow:0_30px_100px_#0009] [&_h2]:[font-family:Georgia,_serif] [&_h2]:[font-style:italic] [&_h2]:text-[32px] [&_h2]:font-normal [&_h2]:leading-[1.2] [&_h2]:mt-[13px] [&_h2]:tracking-[-1px] [&_blockquote]:mt-7 [&_blockquote]:mx-0 [&_blockquote]:mb-5 [&_blockquote]:border-l [&_blockquote]:border-l-[#ff7145] [&_blockquote]:pt-[3px] [&_blockquote]:pr-0 [&_blockquote]:pb-[3px] [&_blockquote]:pl-4.5 [&_blockquote]:text-[#efd8ca] [&_blockquote]:text-[17px] [&_blockquote]:leading-[1.6] [&_blockquote]:wrap-anywhere [&_blockquote]:whitespace-pre-wrap max-[601px]:py-8.5 max-[601px]:px-[25px]"
        }
        aria-labelledby="ember-brief-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              dismiss();
          }
        }}
      >
        <button
          type="button"
          className="prompt-study-close shrink-0 inline-flex items-center justify-center w-11 h-11 border-0 rounded-full bg-transparent text-[#d5c3b7] [transition:transform_140ms_cubic-bezier(0.23,_1,_0.32,_1)] absolute right-3 top-3 pointer-fine:[&:hover]:bg-[#ff714512] pointer-fine:[&:hover]:text-[#fff3e9]"
          onClick={dismiss}
          aria-label="Close idea preview"
        >
          <X size={19} aria-hidden="true" />
        </button>
        <Asterisk
          className="prompt-study-briefIcon text-[#ff7145] mb-[25px]"
          size={30}
          strokeWidth={1.3}
          aria-hidden="true"
        />
        <p className="prompt-study-briefLabel uppercase text-[10px] tracking-[0.13em] text-[#ce9579]">
          Your starting point
        </p>
        <h2 id="ember-brief-title">There’s a spark in that.</h2>
        <blockquote>{brief}</blockquote>
        <p className="prompt-study-briefNote text-[#bda89d] text-[12px] leading-[1.7]">
          This is a preview of the prompt experience. Your idea stays on this
          page; no app is being generated.
        </p>
        <button
          type="button"
          className="prompt-study-edit inline-flex items-center justify-center gap-4 min-h-11 bg-[#ff7145] text-[#170c07] py-3 px-4.5 mt-7 border-0 rounded-[8px] text-[13px] pointer-fine:[&:hover]:bg-[#ff946e] [@media(prefers-reduced-motion:_no-preference)]:[&:active]:[transform:scale(0.97)] [@media(prefers-reduced-motion:_no-preference)]:[&:focus-visible:active]:transform-none"
          onClick={dismiss}
        >
          Keep shaping it <ArrowRight size={17} aria-hidden="true" />
        </button>
      </dialog>
    </main>
  );
}
