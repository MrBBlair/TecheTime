interface Step3CompleteProps {
  onComplete: () => void;
  onPrevious: () => void;
}

export default function Step3Complete({ onComplete, onPrevious }: Step3CompleteProps) {

  return (
    <div className="text-center space-y-8 animate-fade-in">
      <div>
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-royal-purple mb-2">
          Setup Complete!
        </h2>
        <p className="text-gray-600">
          Your business is ready. Let's get started!
        </p>
      </div>

      <div className="space-y-4 text-charcoal text-left">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-royal-purple/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Add Locations</h3>
            <p className="text-sm text-gray-600">Create locations for your business</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-royal-purple/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Add Workers</h3>
            <p className="text-sm text-gray-600">Invite your team and set up PINs</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-royal-purple/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Start Tracking</h3>
            <p className="text-sm text-gray-600">Begin tracking time and generating reports</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onPrevious}
          className="btn-outline flex-1"
          aria-label="Go back"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          className="btn-primary flex-1 text-lg py-4"
          aria-label="Go to dashboard"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
