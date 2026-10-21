import { ArrowRight, ArrowUpRight } from 'lucide-react';

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
    </div>
  );
}
