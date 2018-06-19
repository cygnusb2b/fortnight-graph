node {
  def nodeBuilder = docker.image("node:8")
  nodeBuilder.pull()

  try {
    stage('Checkout') {
      checkout scm
    }
    stage('Test') {
      try {
        sh 'yarn run coverage'
        junit 'coverage/test-results.xml'
        cobertura autoUpdateHealth: false, autoUpdateStability: false, coberturaReportFile: 'coverage/cobertura-coverage.xml', conditionalCoverageTargets: '70, 0, 0', failUnhealthy: false, failUnstable: false, lineCoverageTargets: '80, 0, 0', maxNumberOfBuilds: 0, methodCoverageTargets: '80, 0, 0', onlyStable: false, sourceEncoding: 'ASCII', zoomCoverageChart: false
      } catch (e) {
        junit 'coverage/test-results.xml'
        cobertura autoUpdateHealth: false, autoUpdateStability: false, coberturaReportFile: 'coverage/cobertura-coverage.xml', conditionalCoverageTargets: '70, 0, 0', failUnhealthy: false, failUnstable: false, lineCoverageTargets: '80, 0, 0', maxNumberOfBuilds: 0, methodCoverageTargets: '80, 0, 0', onlyStable: false, sourceEncoding: 'ASCII', zoomCoverageChart: false
        sh 'yarn run postcoverage'
        throw e
      }
    }
  } catch (e) {
    slackSend color: 'bad', channel: '#codebot', message: "Failed testing ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
    throw e
  }

  if (env.BRANCH_NAME == 'master') {
    try {
      stage('Yarn Production Install') {
        nodeBuilder.inside("-v ${env.WORKSPACE}:/app -u 0:0") {
          sh 'yarn install --production'
        }
      }

      docker.withRegistry('https://664537616798.dkr.ecr.us-east-1.amazonaws.com', 'ecr:us-east-1:aws-jenkins-login') {
        stage('Build Container') {
          myDocker = docker.build("fortnight-graph:v${env.BUILD_NUMBER}", '.')
        }
        stage('Push Container') {
          myDocker.push("latest");
          myDocker.push("v${env.BUILD_NUMBER}");
        }
      }

      stage('Trigger Deployment') {
        build job: 'Custom Deployments/nativex-graph', parameters: [string(name: 'BUILD_NUM', value: "${env.BUILD_NUMBER}")], wait: false
      }

    } catch (e) {
      slackSend color: 'bad', message: "Failed deploying ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
      throw e
    }
  }
}
