import React from 'react';

function WelcomeFooter() {
    return (
        <footer className="bg-base-300/50 backdrop-blur-sm py-8">
            <div className="container mx-auto px-4 text-center">
                <p className="text-base text-base-content/60">
                    © {new Date().getFullYear()} Gestion de Stock OCP. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

export default WelcomeFooter;