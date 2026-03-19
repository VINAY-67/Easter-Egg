import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RiddleInput = ({ 
    riddleText, 
    hintText, 
    onSubmit, 
    attemptsLeft, 
    isLocked, 
    lockoutTimeLeft = 0,
    placeholder = "Enter your answer...",
    showSuccess = false,
    clue = "",
    clueLabel = "Your Clue",
    redirectCountdown = 0,
    onRedirect = null,
    levelName = ""
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [lastAttemptTime, setLastAttemptTime] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!inputValue.trim() || isSubmitting || isLocked) return;

        const now = Date.now();
        if (now - lastAttemptTime < 1000) {
            setErrorMessage('Please wait before submitting again...');
            setTimeout(() => setErrorMessage(''), 2000);
            return;
        }

        setLastAttemptTime(now);
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            await onSubmit(inputValue.trim());
        } catch (err) {
            setErrorMessage(err.message || 'Incorrect answer. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (redirectCountdown > 0 && onRedirect) {
            const timer = setTimeout(() => {
                onRedirect();
            }, redirectCountdown * 1000);
            return () => clearTimeout(timer);
        }
    }, [redirectCountdown, onRedirect]);

    if (showSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="riddle-success"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="success-icon"
                >
                    ✓
                </motion.div>
                <h2>Correct!</h2>
                <p>You've solved the riddle.</p>
                
                {clue && (
                    <div className="clue-reveal">
                        <span className="clue-label">{clueLabel}:</span>
                        <span className="clue-value">{clue}</span>
                    </div>
                )}

                {redirectCountdown > 0 && (
                    <p className="redirect-message">
                        Redirecting in {redirectCountdown}...
                    </p>
                )}
            </motion.div>
        );
    }

    if (isLocked) {
        const isSixHourLockout = lockoutTimeLeft > 3600;
        const displayTime = isSixHourLockout 
            ? `${Math.ceil(lockoutTimeLeft / 3600)} hours`
            : `${lockoutTimeLeft} seconds`;
        
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="riddle-locked"
            >
                <div className="lockout-icon">🔒</div>
                <h2>Too many attempts!</h2>
                <p className="lockout-message">
                    You have exhausted all attempts. Try again in <span className="countdown">{displayTime}</span>.
                </p>
                <div className="lockout-progress">
                    <div 
                        className="lockout-bar" 
                        style={{ width: `${isSixHourLockout ? 100 : (lockoutTimeLeft / 30) * 100}%` }}
                    />
                </div>
            </motion.div>
        );
    }

    return (
        <div className="riddle-container">
            <AnimatePresence>
                {levelName && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="level-badge"
                    >
                        {levelName}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="riddle-text-box">
                <p className="riddle-text">{riddleText}</p>
                {hintText && (
                    <details className="hint-section">
                        <summary>💡 Hint</summary>
                        <p>{hintText}</p>
                    </details>
                )}
            </div>

            <form onSubmit={handleSubmit} className="riddle-form">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={placeholder}
                    className="riddle-input"
                    disabled={isSubmitting || isLocked}
                    autoComplete="off"
                />
                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="submit-button"
                    disabled={isSubmitting || !inputValue.trim() || isLocked}
                >
                    {isSubmitting ? 'Checking...' : 'Submit'}
                </motion.button>
            </form>

            <div className="attempts-counter">
                Attempts remaining: <span className={attemptsLeft <= 1 ? 'danger' : ''}>{attemptsLeft}/3</span>
            </div>

            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="error-message"
                    >
                        ❌ {errorMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .riddle-container {
                    width: 100%;
                    max-width: 600px;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .level-badge {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.5rem 1.5rem;
                    border-radius: 50px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    align-self: center;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .riddle-text-box {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 2rem;
                    backdrop-filter: blur(10px);
                }

                .riddle-text {
                    font-size: 1.2rem;
                    line-height: 1.8;
                    color: #e2e8f0;
                    margin: 0;
                    font-style: italic;
                }

                .hint-section {
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    cursor: pointer;
                }

                .hint-section summary {
                    color: #a0aec0;
                    font-size: 0.9rem;
                    outline: none;
                }

                .hint-section p {
                    margin-top: 0.5rem;
                    color: #718096;
                    font-size: 0.9rem;
                }

                .riddle-form {
                    display: flex;
                    gap: 1rem;
                }

                .riddle-input {
                    flex: 1;
                    padding: 1rem 1.5rem;
                    font-size: 1rem;
                    background: rgba(0, 0, 0, 0.3);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: white;
                    outline: none;
                    transition: all 0.3s ease;
                    font-family: 'JetBrains Mono', monospace;
                }

                .riddle-input:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
                }

                .riddle-input:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .submit-button {
                    padding: 1rem 2rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }

                .submit-button:hover:not(:disabled) {
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                    transform: translateY(-2px);
                }

                .submit-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .attempts-counter {
                    text-align: center;
                    color: #a0aec0;
                    font-size: 0.9rem;
                }

                .attempts-counter .danger {
                    color: #ef4444;
                    font-weight: bold;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    padding: 1rem;
                    border-radius: 12px;
                    text-align: center;
                    font-size: 0.9rem;
                }

                /* Success State */
                .riddle-success {
                    text-align: center;
                    padding: 3rem;
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    border-radius: 20px;
                }

                .success-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    color: white;
                    margin: 0 auto 1.5rem;
                    box-shadow: 0 10px 30px rgba(34, 197, 94, 0.4);
                }

                .riddle-success h2 {
                    color: #22c55e;
                    margin: 0 0 0.5rem;
                    font-size: 2rem;
                }

                .riddle-success p {
                    color: #a0aec0;
                    margin: 0 0 2rem;
                }

                .clue-reveal {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1.5rem;
                    border-radius: 12px;
                    margin: 1rem 0;
                }

                .clue-label {
                    display: block;
                    color: #a0aec0;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 0.5rem;
                }

                .clue-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #fbbf24;
                    font-family: 'JetBrains Mono', monospace;
                    letter-spacing: 4px;
                }

                .redirect-message {
                    color: #667eea;
                    font-weight: 600;
                    margin-top: 1rem;
                }

                /* Locked State */
                .riddle-locked {
                    text-align: center;
                    padding: 3rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 20px;
                }

                .lockout-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .riddle-locked h2 {
                    color: #ef4444;
                    margin: 0 0 1rem;
                }

                .lockout-message {
                    color: #a0aec0;
                    margin: 0;
                }

                .lockout-message .countdown {
                    color: #ef4444;
                    font-weight: bold;
                    font-size: 1.2rem;
                }

                .lockout-progress {
                    width: 100%;
                    height: 6px;
                    background: rgba(239, 68, 68, 0.2);
                    border-radius: 3px;
                    margin-top: 1.5rem;
                    overflow: hidden;
                }

                .lockout-bar {
                    height: 100%;
                    background: #ef4444;
                    transition: width 1s linear;
                }
            `}</style>
        </div>
    );
};

export default RiddleInput;
