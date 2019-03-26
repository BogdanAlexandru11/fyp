# ANPR system using a drone

### OS
Some Linux knowledge will be needed in order to install and set up all the dependencies needed for this project.
A Linux computer will be needed, an ubuntu virtual machine could be used but I wouldn't recommend it.

Install Ubuntu 18.04 on a pc/laptop.
Instructions on how to install ubuntu can be found : https://tutorials.ubuntu.com/tutorial/tutorial-install-ubuntu-desktop

For the local development install both node and mysql.
### Database setup for the local development
* git : sudo apt-get install git-core 
* node : curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
 sudo apt-get install -y nodejs
* mysql : sudo apt-get install mysql-server
 mysql_secure_installation

Create a database called **fyp** : CREATE DATABASE fyp;
Create the tables and the required user using the instructions in the file **database_info.txt**


The cloud computing platform used for this project is DigitalOcean
Use the following link to sign up in order to get $100 credit for 60 days : https://m.do.co/c/4f1abc8a2543

Create a project then create a droplet.
The droplet that I have used is Ubuntu 18.04 as it was the latest version of Ubuntu at the time when I was working on the project.

Install the following : 
* git : sudo apt-get install git-core 
* node : curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
 sudo apt-get install -y nodejs
* mysql : sudo apt-get install mysql-server
 mysql_secure_installation

### Database setup for the droplet
Create a database called **fyp** : CREATE DATABASE fyp;
Create the tables and the required user using the instructions in the file **database_info.txt**

## Nginx setup
Installing Nginx and Nginx-RTMP
Install the tools required to compile Nginx and Nginx-RTMP from source.

**sudo apt-get install build-essential libpcre3 libpcre3-dev libssl-dev**

* Make a working directory and switch to it.
* mkdir ~/working 
* cd ~/working 
* Download the Nginx and Nginx-RTMP source.:
wget http://nginx.org/download/nginx-1.7.5.tar.gz wget https://github.com/arut/nginx-rtmp-module/archive/master.zip 
* Install the Unzip package **sudo apt-get install unzip** 
* Extract the Nginx and Nginx-RTMP source
* tar -zxvf nginx-1.7.5.tar.gz unzip master.zip
*  Switch to the Nginx directory.
* cd nginx-1.7.5 Add modules that Nginx will be compiled with. Nginx-RTMP is included.
* ./configure --with-http_ssl_module --add-module=../nginx-rtmp-module-master Compile and install Nginx with Nginx-RTMP.
* make sudo make install Install the Nginx init scripts.
* sudo wget https://raw.github.com/JasonGiedymin/nginx-init-ubuntu/master/nginx -O /etc/init.d/nginx sudo chmod +x /etc/init.d/nginx sudo update-rc.d nginx defaults Start and stop Nginx to generate configuration files.
* sudo service nginx start sudo service nginx stop 

### Installing FFmpeg
* Add the FFmpeg PPA.
* sudo apt-get install software-properties-common sudo add-apt-repository ppa:kirillshkrogalev/ffmpeg-next 
* Update the package lists.
* sudo apt-get update Install FFmpeg.
* sudo apt-get install ffmpeg Note: The apt-add-repository command may not be installed in some cases. To install it run sudo apt-get install software-properties-common. 


### Configuring Nginx-RTMP and FFmpeg
* Open the Nginx configuration file : 
**sudo nano /usr/local/nginx/conf/nginx.conf**
Append the following.

        rtmp { 
                server { listen 1935; chunk_size 8192;
                application live {
                        live on;
                        record off;
                        exec ffmpeg -i rtmp://localhost/live/$name -threads 1 -c:v libx264 -profile:v baseline -b:v 6000K -s 1920x1200 -f flv -c:a aac -ac 1 -strict -2 -b:a 56k rtmp://localhost/live360p/$name;
                }
                application live360p {
                        live on;
                        record off;
                }
                }
        }
Save the file & restart nginx : **sudo service nginx restar**

The application will stream to the Finally in the app set your cutom rtmp stream to **rtmp://yourdropletip/live/mydjidrone**

Now the application can be tested by setting up the drone(adding the propellers etc), connecting the controller to the drone and opening the App **DJI GO 4** on your mobile phone. Under settings select **Choose streaming platform** and add **rtmp://yourdropletip/live/mydjidrone** where yourdropletip is the ip address of the digitalocean droplet.

In the left hand side top corner view on the DJI GO 4 application you can see if the framerate is greater than 0, if that's the case then the live feed is being streamed successfully and can be viewed using VLC player using the link **rtmp://yourdropletip/live/mydjidrone**


Create an account on the OpenALPR webiste : https://www.openalpr.com/
We need the functionality of a premium account which costs $40 per month. In order to avoid this we need to create a new account every 14 days. 
Once logged in go to 
* Getting Started
* Ubuntu Linux 
* Read Instructions 
* and run this command on the droplet **bash <(curl https://deb.openalpr.com/install)**
* When prompted the installation settings, select he "OpenALPR agent" and follow the installation instructions. After the installation you will be asked to log in into your OpenALPR account, once that is done the agent is installed and can be seen on their website under "Configuration" -> "Agents"

### Setting up the project on the droplet
* Clone the project : **git@github.com:BogdanAlexandru11/fyp.git**
* cd into the folder : **cd fyp**
* run : **npm install** (to update all the dependencies)
* if everything was set up the command should run sucessfully


### Setting up the webhooks
With the node server running on the droplet, the webhooks can be set up as follows:
* go to the OpenALPR website
* Configuration
* Webhooks 
* Add the following **http://yourdropletid:3000/alprPOST?postedFromOpenAlprfyp2018**
* select "Send all plates"

If the command ran sucessfully you're all set up : 
        with the live streaming on, point the drone camera to any registration plate and they can be observer on both the openalpr website and on "http://yourdropletid:3000", the password is "fyp2018"



