package limit0.rancher.api

import groovy.json.JsonSlurperClassic

public class Stack {
  String rancherAccessKey
  String rancherSecretKey
  String rancherHost
  String rancherStackId
  String version
  String key
  String value

  def Stack(url, stackId, accessKey, secretKey) {
    this.rancherHost = url
    this.rancherStackId = stackId
    this.rancherAccessKey = accessKey
    this.rancherSecretKey = secretKey
  }

  def getApiConnection(String endpoint = "") {
    String authString = "${rancherAccessKey}:${rancherSecretKey}".getBytes().encodeBase64().toString()
    def url = new URL("${rancherHost}/v2-beta/stacks/${rancherStackId}/${endpoint}").openConnection()
    url.setRequestProperty("Authorization", "Basic ${authString}")
    return url
  }

  def getServicesByTagValue(key, value) {
    List filtered = []
    URLConnection connection = getApiConnection('services')
    def services = new JsonSlurperClassic().parse(new BufferedReader(new InputStreamReader(connection.getInputStream())))
    services.data.each {
      if (it.launchConfig.labels[key] == value) {
        filtered.add(it)
      }
    }
    return filtered
  }
}

import limit0.rancher.api.Stack

node {
  def nodeBuilder = docker.image("node:8")
  nodeBuilder.pull()
  try {
    stage('Checkout') {
      checkout([$class: 'GitSCM', branches: [[name: "refs/tags/${env.tag_name}"]], browser: [$class: 'GithubWeb', repoUrl: 'https://github.com/cygnusb2b/fortnight-graph'], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'CloneOption', depth: 0, noTags: false, reference: '', shallow: true]], submoduleCfg: [], userRemoteConfigs: [[credentialsId: 'github-login', url: 'https://github.com/cygnusb2b/fortnight-graph']]])
    }
    stage('Yarn Install') {
      nodeBuilder.inside("-v ${env.WORKSPACE}:/app -u 0:0") {
        sh 'yarn install --production'
      }
    }
    docker.withRegistry('https://664537616798.dkr.ecr.us-east-1.amazonaws.com', 'ecr:us-east-1:aws-jenkins-login') {
      stage('Build Container') {
        myDocker = docker.build("nativex-graph:${env.tag_name}", '.')
      }
      stage('Push Container') {
        myDocker.push("${env.tag_name}");
      }
    }
  } catch (e) {
    slackSend color: 'bad', channel: '#codebot', message: "Failed building ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
    throw e
  }

  withCredentials([usernamePassword(credentialsId: 'rancher-production', passwordVariable: 'SECRET_KEY', usernameVariable: 'ACCESS_KEY')]) {
    Stack stack = new Stack("https://rancher.as3.io", "1st739", "$ACCESS_KEY", "$SECRET_KEY");
    def services = stack.getServicesByTagValue('nativex-target', 'graph')
    def stepsForParallel = [:]

    for (int i = 0; i < services.size(); i++) {
      def item = services[i]
      def stepName = "Deploy ${item.name}"
      stepsForParallel[stepName] = { ->
        try {
          rancher confirm: true, credentialId: 'rancher-production', endpoint: 'https://rancher.as3.io/v2-beta', environmentId: '1a42893',  environments: '', ports: '', timeout: 180, image: "664537616798.dkr.ecr.us-east-1.amazonaws.com/nativex-graph:${env.tag_name}", service: "adx-nativex/${item.name}"
        } catch (e) {
          slackSend color: 'bad', message: "Failed deploying instance '${item.name}' ${env.JOB_NAME} #${env.BUILD_NUMBER} ${env.tag_name} (<${env.BUILD_URL}|View>)"
          throw e
        }
      }
    }

    parallel stepsForParallel
  }

  parallel slack: {
    slackSend color: 'good', message: "Finished deploying ${env.JOB_NAME} #${env.BUILD_NUMBER} ${env.tag_name} (<${env.BUILD_URL}|View>)"
  }, newRelic: {
    sh "curl -s --fail -X POST 'https://api.newrelic.com/v2/applications/101523492/deployments.json' \
      -H 'X-Api-Key:2b32185f3daf2b09133738cf4263d052195765465b0d092' -i \
      -H 'Content-Type: application/json' \
      -d '{ \"deployment\": { \"revision\": \"graph ${env.tag_name}\", \"user\": \"jenkins\" } }'"
  }, sentry: {
    sh "curl -s --fail https://sentry.as3.io/api/hooks/release/builtin/10/28030b8c0f65250244855e5b85483ad830692a84fc389727757bc2fac27f33e3/ \
      -X POST \
      -H 'Content-Type: application/json' \
      -d '{\"version\": \"graph ${env.tag_name}\"}'"
  }, github: {
    // update GH deployment API
  }
}
