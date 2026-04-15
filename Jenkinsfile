pipeline {
    // This tells Jenkins to run inside an isolated Docker container for every build job.
    // If multiple builds run at once, Jenkins creates separate containers/pods for each one!
    agent {
        docker {
            image 'node:20'
            args '-u root:root'
        }
    }

    environment {
        // You can define variables here, for example mapping Supabase keys
        // To use real secrets, configure them in Jenkins Credentials and use credentials('CREDENTIAL_NAME')
        VITE_SUPABASE_KEY = 'your_build_time_key_here'
    }

    stages {
        stage('Initialize & Setup') {
            steps {
                echo 'Accessing the locally mounted project directory...'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('/app') {
                    echo 'Installing Node Dependencies...'
                    sh 'npm install'
                }
            }
        }

        stage('Run Linter') {
            steps {
                dir('/app') {
                    echo 'Linting the code...'
                    sh 'npm run lint'
                }
            }
        }

        stage('Build React Frontend') {
            steps {
                dir('/app') {
                    echo 'Building Vite Application...'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build & Deploy') {
            // This stage is commented out by default because Jenkins needs Docker permissions to run this 
            // (e.g. mapping /var/run/docker.sock to the Jenkins container)
            steps {
                echo 'Building Docker container...'
                /*
                sh 'docker build --build-arg VITE_SUPABASE_KEY=${VITE_SUPABASE_KEY} -t hms-frontend-prod .'
                */
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
        success {
            echo '✅ Build Successful! The application is ready to be deployed.'
        }
        failure {
            echo '❌ Build Failed. Please review the error logs.'
        }
    }
}
