pipeline {
    // We now use 'any' because Node.js is installed directly in our Jenkins image!
    // This is much faster and more stable than spinning up a new container for every build.
    agent any

    environment {
        VITE_SUPABASE_KEY = 'your_build_time_key_here'
    }

    stages {
        stage('Initialize & Setup') {
            steps {
                echo 'Cleaning up and preparing build environment...'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node Dependencies...'
                // Use --frozen-lockfile or --no-audit for faster builds
                sh 'npm install'
            }
        }

        stage('Build React Frontend') {
            steps {
                echo 'Building Vite Application...'
                sh 'npm run build'
            }
        }

        stage('Docker Build & Deploy') {
            steps {
                echo 'Building Docker container...'
                /*
                // Example of how you would build the final prod image
                sh 'docker build -t hms-frontend-prod .'
                */
            }
        }
    }

    post {
        always {
            echo '====================================================='
            echo '   HOSPITAL MANAGEMENT SYSTEM PIPELINE COMPLETED     '
            echo '====================================================='
        }
        success {
            echo '''
🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢
███████╗██╗   ██╗ ██████╗ ██████╗███████╗███████╗
██╔════╝██║   ██║██╔════╝██╔════╝██╔════╝██╔════╝
███████╗██║   ██║██║     ██║     █████╗  ███████╗
╚════██║██║   ██║██║     ██║     ██╔══╝  ╚════██║
███████║╚██████╔╝╚██████╗╚██████╗███████╗███████║
╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝╚══════╝╚══════╝
🟢 PROJECT IS READY TO GO LIVE! (GREEN CARD) 🟢
🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢
'''
        }
        failure {
            echo '''
🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 
███████╗ █████╗ ██╗██╗     ███████╗██████╗ 
██╔════╝██╔══██╗██║██║     ██╔════╝██╔══██╗
█████╗  ███████║██║██║     █████╗  ██║  ██║
██╔══╝  ██╔══██║██║██║     ██╔══╝  ██║  ██║
██║     ██║  ██║██║███████╗███████╗██████╔╝
╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝ 
🔴 FATAL ERROR DETECTED! DEPLOYMENT HALTED! 🔴
🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 
'''
        }
    }
}
