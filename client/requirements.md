## Packages
framer-motion | For smooth page transitions and micro-interactions
recharts | For visualizing interview scores and breakdown
lucide-react | For beautiful iconography (already in base, but emphasizing usage)
clsx | For conditional class merging
tailwind-merge | For merging tailwind classes safely
react-circular-progressbar | For the countdown timer visualization
date-fns | For date formatting

## Notes
- Frontend must handle the multipart/form-data upload for resume parsing manually (not via JSON body).
- The interview flow relies on `interviewStatus` returned from `nextQuestion`.
- `shadcn` components are assumed to be available or I will implement basic versions of them if needed, but I will focus on custom styling for maximum quality.
- Fonts used: 'Inter' for UI, 'Space Grotesk' for display/numbers.
