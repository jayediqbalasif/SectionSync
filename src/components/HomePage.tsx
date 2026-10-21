import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';

const FAQ = [
  [
    'Do I need an account?',
    'No. Open the planner and start choosing sections. SectionSync does not need a sign-in or a backend.',
  ],
  [
    'Where is my routine saved?',
    'Your courses, selections, and saved plans stay in this browser on this device. Use Storage & backups to download a JSON backup. Clearing browser data can remove your workspace.',
  ],
  [
    'How do fixed time slots work?',
    'Set a course to Theory or Lab. In the section editor, choose the class days and one time slot. The preview shows the meetings that will be saved.',
  ],
  [
    'How do I avoid overlapping classes?',
    'Turn on Hide conflicts in Planner to hide sections that overlap your current choices. You can turn it off to compare alternatives.',
  ],
  [
    'Can I print or move my routine to another device?',
    'Open Routine to print or save a PDF. To move your editable workspace, export a JSON backup and import it in the other browser.',
  ],
  [
    'Is this an official registration system?',
    'No. SectionSync is a planning tool. Confirm course details with your university and complete registration through its official system. The starter courses are examples.',
  ],
];

export function HomePage({
  onPlanner,
  onRoutine,
}: {
  onPlanner: () => void;
  onRoutine: () => void;
}) {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div>
          <p className="eyebrow">§ 00 — SECTIONSYNC</p>
          <h1 id="home-title">
            A clear week.
            <br />
            Before it begins.
          </h1>
          <p className="home-intro">
            Choose your sections. Find the overlaps. Build a class routine that works for you.
          </p>
          <div className="home-actions">
            <button className="button primary" onClick={onPlanner}>
              Open planner <ArrowRight size={16} />
            </button>
            <button className="text-button" onClick={onRoutine}>
              View routine <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
        <aside className="home-outline" aria-label="How it works">
          <p className="eyebrow">FROM COURSES TO A CLEAR WEEK</p>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h2>Add your courses.</h2>
                <p>Keep every section and faculty option in one place.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h2>Make your choices.</h2>
                <p>Pick class days and time slots. Filter out overlaps.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h2>See your week.</h2>
                <p>Compare your routine, save a plan, and take a copy.</p>
              </div>
            </li>
          </ol>
          <p className="home-device-note">No account. Saved on your device.</p>
        </aside>
      </section>
      <section className="home-features" aria-label="Planning essentials">
        <div>
          <span className="eyebrow">01 / PLANNER</span>
          <h2>
            Less input.
            <br />
            More clarity.
          </h2>
          <p>Quick day choices and fixed time slots keep section editing simple.</p>
        </div>
        <div>
          <span className="eyebrow">02 / ROUTINE</span>
          <h2>
            The whole week.
            <br />
            In one view.
          </h2>
          <p>See your selected classes, credits, campus days, and gaps together.</p>
        </div>
        <div>
          <span className="eyebrow">03 / YOUR WORKSPACE</span>
          <h2>
            Keep a plan.
            <br />
            Take a backup.
          </h2>
          <p>Save different plans in your browser and export a copy when you need it.</p>
        </div>
      </section>
      <section className="home-faq" id="faq" aria-labelledby="faq-title">
        <div className="faq-heading">
          <p className="eyebrow">§ 01 — GOOD TO KNOW</p>
          <h2 id="faq-title">
            Questions,
            <br />
            answered.
          </h2>
        </div>
        <div className="faq-list">
          {FAQ.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <Plus size={16} aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
