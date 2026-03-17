import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

function Hero() {
    const [titleNumber, setTitleNumber] = useState(0);

    const titles = useMemo(() => ['tailored', 'scalable', 'extensible', 'production-ready', 'reliable'], []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <div className="w-full">
            <div className="container mx-auto">
                <div className="flex gap-8 items-center justify-center flex-col">
                    <div className="flex gap-4 flex-col">
                        <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
                            <span className="text-primary-foreground">Backend architecture built around your idea</span>

                            <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                                &nbsp;
                                {titles.map((title, index) => (
                                    <motion.span
                                        key={index}
                                        className="absolute font-semibold text-primary"
                                        initial={{ opacity: 0, y: '-100' }}
                                        transition={{ type: 'spring', stiffness: 50 }}
                                        animate={
                                            titleNumber === index
                                                ? { y: 0, opacity: 1 }
                                                : {
                                                      y: titleNumber > index ? -150 : 150,
                                                      opacity: 0
                                                  }
                                        }
                                    >
                                        {title}
                                    </motion.span>
                                ))}
                            </span>
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { Hero };
