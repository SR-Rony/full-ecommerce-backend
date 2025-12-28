sudo docker volume create protonmail
sudo docker run --rm -it -v protonmail:/root shenxn/protonmail-bridge init