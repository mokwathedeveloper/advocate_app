
fix the following errors:

```shell

  VITE v5.4.19  ready in 228 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
Error:   Failed to scan for dependencies from entries:
  /workspaces/advocate_app/index.html
/workspaces/advocate_app/backend/templates/email/appointment-confirmation.html
/workspaces/advocate_app/backend/templates/email/case-update.html
/workspaces/advocate_app/backend/templates/email/payment-confirmation.html
/workspaces/advocate_app/backend/templates/email/welcome.html

  ✘ [ERROR] Expected identifier but found "`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${"

    src/components/Layout/Navbar.tsx:129:27:
      129 │ ...lassName={`flex items-center space-x-2 px-3 py-2 rounded-lg te...
          ╵              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


✘ [ERROR] Unexpected "{"

    src/components/ui/Button.tsx:17:7:
      17 │ import { motion } from 'framer-motion';
         ╵        ^


✘ [ERROR] Expected ";" but found ")"

    src/components/ui/Card.tsx:118:1:
      118 │ }) => {
          │  ^
          ╵  ;


✘ [ERROR] Unexpected "..."

    src/components/ui/Input.tsx:104:2:
      104 │   ...props
          ╵   ~~~


✘ [ERROR] The symbol "cases" has already been declared

    src/pages/Cases.tsx:139:8:
      139 │   const [cases, setCases] = useState<Case[]>([]);
          ╵         ^

  The symbol "cases" was originally declared here:

    src/pages/Cases.tsx:116:8:
      116 │   const {
          ╵         ^


✘ [ERROR] The symbol "setShowCreateForm" has already been declared

    src/pages/Cases.tsx:142:8:
      142 │   const [showCreateForm, setShowCreateForm] = useState(false);
          ╵         ^

  The symbol "setShowCreateForm" was originally declared here:

    src/pages/Cases.tsx:109:8:
      109 │   const [showCreateForm, setShowCreateForm] = useState(false);
          ╵         ^


✘ [ERROR] The symbol "showCreateForm" has already been declared

    src/pages/Cases.tsx:142:8:
      142 │   const [showCreateForm, setShowCreateForm] = useState(false);
          ╵         ^

  The symbol "showCreateForm" was originally declared here:

    src/pages/Cases.tsx:109:8:
      109 │   const [showCreateForm, setShowCreateForm] = useState(false);
          ╵         ^


✘ [ERROR] The symbol "selectedCase" has already been declared

    src/pages/Cases.tsx:143:8:
      143 │   const [selectedCase, setSelectedCase] = useState<Case | null>(n...
          ╵         ^

  The symbol "selectedCase" was originally declared here:

    src/pages/Cases.tsx:110:8:
      110 │   const [selectedCase, setSelectedCase] = useState(null);
          ╵         ^


✘ [ERROR] The symbol "setSelectedCase" has already been declared

    src/pages/Cases.tsx:143:8:
      143 │   const [selectedCase, setSelectedCase] = useState<Case | null>(n...
          ╵         ^

  The symbol "setSelectedCase" was originally declared here:

    src/pages/Cases.tsx:110:8:
      110 │   const [selectedCase, setSelectedCase] = useState(null);
          ╵         ^


✘ [ERROR] Unexpected "export"

    src/pages/Cases.tsx:853:0:
      853 │ export default Cases;
          ╵ ~~~~~~


✘ [ERROR] Unexpected closing "main" tag does not match opening "div" tag

    src/pages/Home.tsx:347:6:
      347 │     </main>
          │       ~~~~
          ╵       div

  The opening "div" tag is here:

    src/pages/Home.tsx:85:9:
      85 │         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg...
         ╵          ~~~


✘ [ERROR] The character "}" is not valid inside a JSX element

    src/pages/Home.tsx:349:0:
      349 │ };
          │ ^
          ╵ {'}'}

  Did you mean to escape it as "{'}'}" instead?


✘ [ERROR] Unexpected end of file before a closing "section" tag

    src/pages/Home.tsx:351:20:
      351 │ export default Home;
          │                     ^
          ╵                     </section>

  The opening "section" tag is here:

    src/pages/Home.tsx:83:7:
      83 │       <section className="relative bg-gradient-to-br from-navy-900...
         ╵        ~~~~~~~


✘ [ERROR] Expected ">" but found "className"

    src/services/toastService.ts:117:10:
      117 │           className={`
          │           ~~~~~~~~~
          ╵           >


    at failureErrorWithLog (/workspaces/advocate_app/node_modules/esbuild/lib/main.js:1472:15)
    at /workspaces/advocate_app/node_modules/esbuild/lib/main.js:945:25
    at runOnEndCallbacks (/workspaces/advocate_app/node_modules/esbuild/lib/main.js:1315:45)
    at buildResponseToResult (/workspaces/advocate_app/node_modules/esbuild/lib/main.js:943:7)
    at /workspaces/advocate_app/node_modules/esbuild/lib/main.js:955:9
    at new Promise (<anonymous>)
    at requestCallbacks.on-end (/workspaces/advocate_app/node_modules/esbuild/lib/main.js:954:54)
    at handleRequest (/workspaces/advocate_app/node_modules/esbuild/lib/main.js:647:17)
    at handleIncomingPacket (/workspaces/advocate_app/node_modules/esbuild/lib/main.js:672:7)
    at Socket.readFromStdout (/workspaces/advocate_app/node_modules/esbuild/lib/main.js:600:7)
12:47:09 PM [vite] Pre-transform error: [postcss] /workspaces/advocate_app/src/index.css:259:3: Unclosed block
12:47:09 PM [vite] Pre-transform error: /workspaces/advocate_app/src/pages/Home.tsx: Unterminated JSX contents. (347:11)

  345 |         </div>
  346 |       </section>
> 347 |     </main>
      |            ^
  348 |   );
  349 | };
  350 |
12:47:09 PM [vite] Pre-transform error: /workspaces/advocate_app/src/pages/Cases.tsx: Identifier 'React' has already been declared. (7:7)

   5 |
   6 | // Cases management page for LegalPro v1.0.1
>  7 | import React, { useState, useEffect, useCallback } from 'react';
     |        ^
   8 | import { motion, AnimatePresence } from 'framer-motion';
   9 |
  10 | import { useForm } from 'react-hook-form';
12:47:09 PM [vite] Pre-transform error: Transform failed with 1 error:
/workspaces/advocate_app/src/services/toastService.ts:117:10: ERROR: Expected ">" but found "className"
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates';
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x2)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x3)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x4)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x5)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x6)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x7)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x8)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x9)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x10)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x11)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x12)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react';
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x2)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x3)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x4)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x5)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x6)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x7)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x8)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x9)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x10)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x11)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Input.tsx: Identifier 'React' has already been declared. (10:7)

   8 | // Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
   9 |
> 10 | import React from 'react';
     |        ^
  11 |
  12 | import { clsx } from 'clsx';
  13 | import { AlertCircle, CheckCircle } from 'lucide-react';
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Input.tsx: Identifier 'React' has already been declared. (10:7)

   8 | // Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
   9 |
> 10 | import React from 'react';
     |        ^
  11 |
  12 | import { clsx } from 'clsx';
  13 | import { AlertCircle, CheckCircle } from 'lucide-react'; (x2)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Input.tsx: Identifier 'React' has already been declared. (10:7)

   8 | // Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
   9 |
> 10 | import React from 'react';
     |        ^
  11 |
  12 | import { clsx } from 'clsx';
  13 | import { AlertCircle, CheckCircle } from 'lucide-react'; (x3)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Input.tsx: Identifier 'React' has already been declared. (10:7)

   8 | // Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
   9 |
> 10 | import React from 'react';
     |        ^
  11 |
  12 | import { clsx } from 'clsx';
  13 | import { AlertCircle, CheckCircle } from 'lucide-react'; (x4)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Input.tsx: Identifier 'React' has already been declared. (10:7)

   8 | // Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
   9 |
> 10 | import React from 'react';
     |        ^
  11 |
  12 | import { clsx } from 'clsx';
  13 | import { AlertCircle, CheckCircle } from 'lucide-react'; (x5)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Input.tsx: Identifier 'React' has already been declared. (10:7)

   8 | // Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
   9 |
> 10 | import React from 'react';
     |        ^
  11 |
  12 | import { clsx } from 'clsx';
  13 | import { AlertCircle, CheckCircle } from 'lucide-react'; (x6)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Input.tsx: Identifier 'React' has already been declared. (10:7)

   8 | // Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
   9 |
> 10 | import React from 'react';
     |        ^
  11 |
  12 | import { clsx } from 'clsx';
  13 | import { AlertCircle, CheckCircle } from 'lucide-react'; (x7)
12:47:10 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/Layout/Navbar.tsx: Unexpected token (129:27)

  127 |                 className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
  128 | 
> 129 |                 className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      |                            ^
  130 | 
  131 |                   isActive(item.path)
  132 |                     ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 shadow-sm'
12:47:10 PM [vite] Pre-transform error: Transform failed with 1 error:
/workspaces/advocate_app/src/services/toastService.ts:117:10: ERROR: Expected ">" but found "className"
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates';
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x2)
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x3)
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react';
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x2)
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x3)
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Input.tsx: Identifier 'React' has already been declared. (10:7)

   8 | // Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
   9 |
> 10 | import React from 'react';
     |        ^
  11 |
  12 | import { clsx } from 'clsx';
  13 | import { AlertCircle, CheckCircle } from 'lucide-react';
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react';
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Button.tsx: Unexpected token, expected ";" (16:7)

  14 | // Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
  15 |
> 16 | import React from 'react';
     |        ^
  17 | import { motion } from 'framer-motion';
  18 | import { clsx } from 'clsx';
  19 | import { Loader2 } from 'lucide-react'; (x2)
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Input.tsx: Identifier 'React' has already been declared. (10:7)

   8 | // Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
   9 |
> 10 | import React from 'react';
     |        ^
  11 |
  12 | import { clsx } from 'clsx';
  13 | import { AlertCircle, CheckCircle } from 'lucide-react';
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates';
12:47:11 PM [vite] Pre-transform error: /workspaces/advocate_app/src/components/ui/Card.tsx: Identifier 'React' has already been declared. (13:7)

  11 | // Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
  12 |
> 13 | import React from 'react';
     |        ^
  14 | import { motion } from 'framer-motion';
  15 | import { clsx } from 'clsx';
  16 | import { LoadingOverlay, SkeletonCard } from './LoadingStates'; (x2)
12:47:14 PM [vite] Internal server error: [postcss] /workspaces/advocate_app/src/index.css:259:3: Unclosed block
  Plugin: vite:css
  File: /workspaces/advocate_app/src/index.css:259:2
  257|  /* Smooth Theme Transitions */
  258|  @layer base {
  259|    * {
     |    ^
  260|      transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  261|      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      at Input.error (/workspaces/advocate_app/node_modules/postcss/lib/input.js:135:16)
      at Parser.unclosedBlock (/workspaces/advocate_app/node_modules/postcss/lib/parser.js:575:22)
      at Parser.endFile (/workspaces/advocate_app/node_modules/postcss/lib/parser.js:335:35)
      at Parser.parse (/workspaces/advocate_app/node_modules/postcss/lib/parser.js:476:10)
      at parse (/workspaces/advocate_app/node_modules/postcss/lib/parse.js:11:12)
      at new LazyResult (/workspaces/advocate_app/node_modules/postcss/lib/lazy-result.js:165:16)
      at Processor.process (/workspaces/advocate_app/node_modules/postcss/lib/processor.js:53:14)
      at compileCSS (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:36898:59)
      at async TransformPluginContext.transform (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:36171:11)
      at async PluginContainer.transform (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:49099:18)
      at async loadAndTransform (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:51977:27)
      at async viteTransformMiddleware (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:62105:24)
1:04:15 PM [vite] Internal server error: [postcss] /workspaces/advocate_app/src/index.css:259:3: Unclosed block
  Plugin: vite:css
  File: /workspaces/advocate_app/src/index.css:259:2
  257|  /* Smooth Theme Transitions */
  258|  @layer base {
  259|    * {
     |    ^
  260|      transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  261|      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      at Input.error (/workspaces/advocate_app/node_modules/postcss/lib/input.js:135:16)
      at Parser.unclosedBlock (/workspaces/advocate_app/node_modules/postcss/lib/parser.js:575:22)
      at Parser.endFile (/workspaces/advocate_app/node_modules/postcss/lib/parser.js:335:35)
      at Parser.parse (/workspaces/advocate_app/node_modules/postcss/lib/parser.js:476:10)
      at parse (/workspaces/advocate_app/node_modules/postcss/lib/parse.js:11:12)
      at new LazyResult (/workspaces/advocate_app/node_modules/postcss/lib/lazy-result.js:165:16)
      at Processor.process (/workspaces/advocate_app/node_modules/postcss/lib/processor.js:53:14)
      at compileCSS (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:36898:59)
      at async TransformPluginContext.transform (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:36171:11)
      at async PluginContainer.transform (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:49099:18)
      at async loadAndTransform (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:51977:27)
      at async viteTransformMiddleware (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:62105:24) (x2)
1:13:11 PM [vite] Internal server error: [postcss] /workspaces/advocate_app/src/index.css:259:3: Unclosed block
  Plugin: vite:css
  File: /workspaces/advocate_app/src/index.css:259:2
  257|  /* Smooth Theme Transitions */
  258|  @layer base {
  259|    * {
     |    ^
  260|      transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  261|      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      at Input.error (/workspaces/advocate_app/node_modules/postcss/lib/input.js:135:16)
      at Parser.unclosedBlock (/workspaces/advocate_app/node_modules/postcss/lib/parser.js:575:22)
      at Parser.endFile (/workspaces/advocate_app/node_modules/postcss/lib/parser.js:335:35)
      at Parser.parse (/workspaces/advocate_app/node_modules/postcss/lib/parser.js:476:10)
      at parse (/workspaces/advocate_app/node_modules/postcss/lib/parse.js:11:12)
      at new LazyResult (/workspaces/advocate_app/node_modules/postcss/lib/lazy-result.js:165:16)
      at Processor.process (/workspaces/advocate_app/node_modules/postcss/lib/processor.js:53:14)
      at compileCSS (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:36898:59)
      at async TransformPluginContext.transform (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:36171:11)
      at async PluginContainer.transform (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:49099:18)
      at async loadAndTransform (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:51977:27)
      at async viteTransformMiddleware (file:///workspaces/advocate_app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:62105:24) (x3)


```

